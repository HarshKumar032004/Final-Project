// =============================================================================
// BILLING CONTROLLER — Phase 6
// Handles Stripe Checkout Session creation and Webhook event processing.
//
// CRITICAL ARCHITECTURE NOTE (Webhook Body Parsing):
// The Stripe webhook verification REQUIRES the raw request body buffer to
// validate the `stripe-signature` header. This route is mounted in app.ts
// BEFORE express.json() using express.raw({ type: 'application/json' }).
// =============================================================================

import { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../config/database';
import { config } from '../config/env';
import { sendSuccess, sendCreated } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus, PlanType, SubscriptionStatus } from '../types/enums';
import { logAction as auditLog } from '../services/audit.service';
import logger from '../utils/logger';

// ─── Stripe Client (lazy initialisation) ─────────────────────────────────────
// Throws a descriptive error at request time if the key is missing,
// rather than crashing the whole server on startup.
function getStripeClient(): Stripe {
  const key = config.stripe.secretKey;
  if (!key || key === 'sk_test_YOUR_STRIPE_KEY') {
    throw new AppError(
      'Stripe is not configured. Set STRIPE_SECRET_KEY in your .env file.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  return new Stripe(key, { apiVersion: '2024-04-10' });
}

// ─── Plan → Stripe Price ID Lookup Table ─────────────────────────────────────
// Replace these with your real Stripe Price IDs from your Dashboard.
// Create products/prices at: https://dashboard.stripe.com/test/products
const PLAN_PRICE_MAP: Record<string, string> = {
  [PlanType.STARTER]:    config.stripe.prices.starter,
  [PlanType.PRO]:        config.stripe.prices.pro,
  [PlanType.ENTERPRISE]: config.stripe.prices.enterprise,
};

const getPlanTypeFromPriceId = (priceId: string): PlanType | undefined => {
  for (const [plan, id] of Object.entries(PLAN_PRICE_MAP)) {
    if (id === priceId) return plan as PlanType;
  }
  return undefined;
};

// ─── Zod schema for checkout request body ─────────────────────────────────────
import { z } from 'zod';
const CreateCheckoutBodySchema = z.object({
  planId: z.nativeEnum(PlanType, {
    errorMap: () => ({ message: `planId must be one of: ${Object.values(PlanType).join(', ')}` }),
  }),
});

// =============================================================================
// POST /api/v1/billing/create-checkout
// Creates a Stripe Checkout Session for the authenticated company.
// Returns: { checkoutUrl: string }
// =============================================================================
export const createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const stripe = getStripeClient();

  // Validate request body
  const parsed = CreateCheckoutBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new AppError(firstIssue?.message ?? 'Invalid request body', HttpStatus.BAD_REQUEST);
  }
  const { planId } = parsed.data;

  // JwtAccessPayload uses .sub (subject) for the user ID
  const userId    = req.user!.sub;
  const companyId = req.user!.companyId;

  // Fetch the company's current subscription
  const subscription = await prisma.subscription.findUnique({
    where:   { companyId },
    include: { company: { select: { name: true } } },
  });
  if (!subscription) {
    throw new AppError('No subscription record found for this company.', HttpStatus.NOT_FOUND);
  }

  // Prevent downgrade to a plan the company is already on
  if (subscription.planType === planId && subscription.status === SubscriptionStatus.ACTIVE) {
    throw new AppError(`Company is already on the ${planId} plan.`, HttpStatus.CONFLICT);
  }

  // Look up the Stripe price ID for the requested plan
  const priceId = PLAN_PRICE_MAP[planId];
  if (!priceId || priceId.endsWith('_placeholder')) {
    throw new AppError(
      `Stripe Price ID for plan "${planId}" is not configured. Add STRIPE_PRICE_${planId} to .env.`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Resolve or create the Stripe Customer for this company
  let stripeCustomerId = subscription.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name:     subscription.company.name,
      metadata: { companyId, subscriptionId: subscription.id },
    });
    stripeCustomerId = customer.id;

    // Persist the new customer ID immediately
    await prisma.subscription.update({
      where: { companyId },
      data:  { stripeCustomerId },
    });
  }

  // Build success/cancel redirect URLs
  const frontendOrigin = config.cors.allowedOrigins[0] ?? 'http://localhost:3000';

  // Create the Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer:             stripeCustomerId,
    mode:                 'subscription',
    payment_method_types: ['card'],
    line_items: [
      { price: priceId, quantity: 1 },
    ],
    // Pass metadata so the webhook can reconcile the record
    metadata: {
      companyId,
      subscriptionId: subscription.id,
      planId,
      userId,
    },
    success_url: `${frontendOrigin}/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
    cancel_url:  `${frontendOrigin}/billing?status=cancelled`,
    // Collect billing address for VAT/GST compliance
    billing_address_collection: 'auto',
    // Allow promotion codes (optional)
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new AppError('Stripe did not return a checkout URL.', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Fire audit log asynchronously
  auditLog({
    companyId,
    userId,
    action: 'CHECKOUT_SESSION_CREATED',
    entityType: 'Subscription',
    entityId: subscription.id,
    metadata: { planId, stripeSessionId: session.id },
    req,
  });

  logger.info(`[Billing] Checkout session ${session.id} created for company ${companyId} → plan ${planId}`);

  sendCreated(res, { checkoutUrl: session.url, sessionId: session.id }, 'Checkout session created');
});

// =============================================================================
// GET /api/v1/billing/subscription
// Returns the current subscription for the authenticated company.
// =============================================================================
export const getBillingSubscription = asyncHandler(async (req: Request, res: Response) => {
  const sub = await prisma.subscription.findUnique({
    where:   { companyId: req.user!.companyId },
    include: { company: { select: { name: true } } },
  });
  if (!sub) throw new AppError('No subscription found.', HttpStatus.NOT_FOUND);
  sendSuccess(res, sub, 'Subscription retrieved');
});

// =============================================================================
// POST /api/v1/billing/create-portal
// Creates a Stripe Customer Portal Session for managing subscriptions.
// Returns: { portalUrl: string }
// =============================================================================
export const createPortalSession = asyncHandler(async (req: Request, res: Response) => {
  const stripe = getStripeClient();
  const companyId = req.user!.companyId;

  // Fetch the company's current subscription
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
  });

  if (!subscription || !subscription.stripeCustomerId) {
    throw new AppError('No active Stripe customer found. Please subscribe first.', HttpStatus.NOT_FOUND);
  }

  const frontendOrigin = config.cors.allowedOrigins[0] ?? 'http://localhost:3000';

  // Create the Portal Session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${frontendOrigin}/billing`,
  });

  if (!portalSession.url) {
    throw new AppError('Stripe did not return a portal URL.', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Audit log
  auditLog({
    companyId,
    userId: req.user!.sub,
    action: 'PORTAL_SESSION_CREATED',
    entityType: 'Subscription',
    entityId: subscription.id,
    req,
  });

  logger.info(`[Billing] Portal session created for company ${companyId}`);

  sendSuccess(res, { portalUrl: portalSession.url }, 'Portal session created');
});


// =============================================================================
// GET /api/v1/billing/stripe/status
// Fetches live subscription dates directly from Stripe API.
// Returns: { currentPlan, status, currentPeriodStart, currentPeriodEnd }
// =============================================================================
export const getStripeStatus = asyncHandler(async (req: Request, res: Response) => {
  const stripe = getStripeClient();
  const companyId = req.user!.companyId;

  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
  });

  if (!subscription) {
    throw new AppError('No subscription found for this company.', HttpStatus.NOT_FOUND);
  }

  let currentPeriodStart: Date | null = null;
  let currentPeriodEnd: Date | null = null;

  if (subscription.stripeSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
      currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
    } catch (error) {
      logger.error(`Failed to retrieve Stripe subscription ${subscription.stripeSubscriptionId}:`, error);
      // Fallback to database dates if Stripe API fails
      currentPeriodStart = subscription.startDate;
      currentPeriodEnd = subscription.endDate;
    }
  } else {
    // If no Stripe subscription ID (e.g., free tier), use database dates
    currentPeriodStart = subscription.startDate;
    currentPeriodEnd = subscription.endDate;
  }

  sendSuccess(res, {
    currentPlan: subscription.planType,
    status: subscription.status,
    currentPeriodStart,
    currentPeriodEnd,
  }, 'Stripe status retrieved');
});

// =============================================================================
// GET /api/v1/billing/stripe/invoices
// Fetches real invoices directly from Stripe API.
// =============================================================================
export const getStripeInvoices = asyncHandler(async (req: Request, res: Response) => {
  const stripe = getStripeClient();
  const companyId = req.user!.companyId;

  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    select: { stripeCustomerId: true },
  });

  if (!subscription || !subscription.stripeCustomerId) {
    // No customer ID yet, so no invoices
    sendSuccess(res, [], 'No invoices found');
    return;
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 10,
    });

    const mappedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number || 'Pending',
      amount_paid: inv.amount_paid,
      status: inv.status,
      created: inv.created, // unix timestamp
      hosted_invoice_url: inv.hosted_invoice_url,
    }));

    sendSuccess(res, mappedInvoices, 'Invoices retrieved');
  } catch (error) {
    logger.error(`Failed to retrieve invoices for customer ${subscription.stripeCustomerId}:`, error);
    throw new AppError('Failed to fetch invoices from Stripe.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
});

// =============================================================================
// GET /api/v1/billing/usage
// Fetches real usage metrics (logs this month, active team members) against plan limits.
// =============================================================================
export const getUsageSummary = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    select: { planType: true },
  });

  const planType = subscription?.planType || PlanType.STARTER;

  // Set limits based on plan
  let logsLimit: number | null = null;
  let teamLimit: number | null = null;

  if (planType === PlanType.STARTER) {
    logsLimit = 100;
    teamLimit = 5;
  }

  // Count active team members
  const activeMembersCount = await prisma.user.count({
    where: { companyId, isActive: true },
  });

  // Count logs generated this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  const logsGeneratedThisMonth = await prisma.emissionRecord.count({
    where: {
      companyId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  // Calculate percentages (cap at 100%)
  const logsPercentage = logsLimit 
    ? Math.min((logsGeneratedThisMonth / logsLimit) * 100, 100)
    : 0;
    
  const teamPercentage = teamLimit
    ? Math.min((activeMembersCount / teamLimit) * 100, 100)
    : 0;

  sendSuccess(res, {
    logs: {
      count: logsGeneratedThisMonth,
      limit: logsLimit,
      percentage: logsPercentage,
    },
    team: {
      count: activeMembersCount,
      limit: teamLimit,
      percentage: teamPercentage,
    }
  }, 'Usage summary retrieved');
});

// =============================================================================
// POST /api/v1/billing/webhook
// Receives and verifies Stripe webhook events.
//
// !! This handler MUST receive the raw Buffer body, NOT the parsed JSON body.
// !! See app.ts for the raw body parser configuration.
// =============================================================================
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripeClient();
  const webhookSecret = config.stripe.webhookSecret;

  if (!webhookSecret || webhookSecret === 'whsec_YOUR_WEBHOOK_SECRET') {
    logger.error('[Webhook] STRIPE_WEBHOOK_SECRET is not configured.');
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Webhook secret not configured.' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing stripe-signature header.' });
    return;
  }

  let event: Stripe.Event;
  try {
    // req.body here is a raw Buffer because the route uses express.raw()
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn(`[Webhook] Signature verification failed: ${message}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: `Webhook Error: ${message}` });
    return;
  }

  logger.info(`[Webhook] Received event: ${event.type} (${event.id})`);

  // ─── Event Dispatch ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── Checkout completed — first successful payment ──────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { companyId, subscriptionId, planId, userId } = session.metadata ?? {};

        if (!companyId || !subscriptionId || !planId) {
          logger.warn('[Webhook] checkout.session.completed missing metadata.');
          break;
        }

        // Retrieve the Stripe Subscription object to get real dates
        let stripeSubscriptionId: string | null = null;
        let periodEnd: Date | null              = null;

        if (typeof session.subscription === 'string') {
          stripeSubscriptionId = session.subscription;
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
          periodEnd = new Date((stripeSub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000);
        }

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            planType:             planId as PlanType,
            status:               SubscriptionStatus.ACTIVE,
            stripeCustomerId:     session.customer as string ?? undefined,
            stripeSubscriptionId: stripeSubscriptionId ?? undefined,
            startDate:            new Date(),
            endDate:              periodEnd ?? undefined,
            trialEndDate:         null, // Trial is over — they paid
          },
        });

        auditLog({
          companyId,
          userId: userId ?? 'system',
          action: 'SUBSCRIPTION_ACTIVATED',
          entityType: 'Subscription',
          entityId: subscriptionId,
          metadata: { planId, stripeSessionId: session.id, stripeSubscriptionId },
        });

        logger.info(`[Webhook] Subscription ${subscriptionId} ACTIVATED → plan ${planId}`);
        break;
      }

      // ── Subscription updated (plan change, renewal, reactivation) ──────────
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const stripeCustomerId = stripeSub.customer as string;

        // Look up our subscription by Stripe customer ID
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId },
        });
        if (!dbSub) {
          logger.warn(`[Webhook] No subscription found for customer ${stripeCustomerId}`);
          break;
        }

        // Map Stripe status → our SubscriptionStatus enum
        const stripeStatusMap: Record<string, SubscriptionStatus> = {
          active:            SubscriptionStatus.ACTIVE,
          past_due:          SubscriptionStatus.PAST_DUE,
          canceled:          SubscriptionStatus.CANCELED,
          trialing:          SubscriptionStatus.TRIALING,
          unpaid:            SubscriptionStatus.PAST_DUE,
          incomplete:        SubscriptionStatus.PAST_DUE,
          incomplete_expired:SubscriptionStatus.CANCELED,
        };

        const newStatus = stripeStatusMap[stripeSub.status] ?? SubscriptionStatus.PAST_DUE;
        const periodEndDate = new Date((stripeSub as unknown as { current_period_end: number }).current_period_end * 1000);

        // Extract active price to derive the new planType in case of a portal upgrade/downgrade
        const activePriceId = stripeSub.items?.data?.[0]?.price?.id;
        const newPlanType = activePriceId ? getPlanTypeFromPriceId(activePriceId) : undefined;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status:  newStatus,
            endDate: periodEndDate,
            ...(newPlanType && { planType: newPlanType }),
          },
        });

        auditLog({
          companyId: dbSub.companyId,
          userId: 'stripe-webhook',
          action: 'SUBSCRIPTION_UPDATED',
          entityType: 'Subscription',
          entityId: dbSub.id,
          metadata: { stripeStatus: stripeSub.status, newStatus, newPlanType },
        });

        logger.info(`[Webhook] Subscription ${dbSub.id} → status ${newStatus}${newPlanType ? ` (Plan: ${newPlanType})` : ''}`);
        break;
      }

      // ── Subscription deleted / expired ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const stripeCustomerId = stripeSub.customer as string;

        const dbSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId },
        });
        if (!dbSub) break;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status:  SubscriptionStatus.CANCELED,
            endDate: new Date(),
          },
        });

        auditLog({
          companyId: dbSub.companyId,
          userId: 'stripe-webhook',
          action: 'SUBSCRIPTION_CANCELED',
          entityType: 'Subscription',
          entityId: dbSub.id,
        });

        logger.info(`[Webhook] Subscription ${dbSub.id} → CANCELED`);
        break;
      }

      // ── Invoice payment failed ─────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;

        const dbSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId },
        });
        if (!dbSub) break;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: { status: SubscriptionStatus.PAST_DUE },
        });

        logger.warn(`[Webhook] Invoice payment failed for customer ${stripeCustomerId} — marked PAST_DUE`);
        break;
      }

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type} — ignored`);
    }
  } catch (handlerErr: unknown) {
    // Log the processing error but still return 200 to Stripe to prevent retries
    const message = handlerErr instanceof Error ? handlerErr.message : 'Unknown handler error';
    logger.error(`[Webhook] Error processing ${event.type}: ${message}`);
  }

  // Always return 200 to acknowledge receipt to Stripe
  res.status(HttpStatus.OK).json({ received: true });
};

// =============================================================================
// POST /api/v1/billing/verify-checkout
// Synchronously verifies a checkout session upon redirect to /billing?session_id=...
// This fixes race conditions where the user is redirected before the webhook arrives,
// or when testing locally without a webhook forwarder.
// =============================================================================
export const verifyCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const stripe = getStripeClient();
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new AppError('Missing sessionId', HttpStatus.BAD_REQUEST);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === 'paid' && session.metadata) {
    const { companyId, subscriptionId, planId, userId } = session.metadata;

    if (companyId && subscriptionId && planId) {
      // Check if it's already updated (by webhook)
      const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
      if (sub && sub.planType !== planId) {
        let stripeSubscriptionId: string | null = null;
        let periodEnd: Date | null = null;

        if (typeof session.subscription === 'string') {
          stripeSubscriptionId = session.subscription;
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
          periodEnd = new Date((stripeSub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000);
        }

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            planType:             planId as PlanType,
            status:               SubscriptionStatus.ACTIVE,
            stripeCustomerId:     session.customer as string ?? undefined,
            stripeSubscriptionId: stripeSubscriptionId ?? undefined,
            startDate:            new Date(),
            endDate:              periodEnd ?? undefined,
            trialEndDate:         null,
          },
        });

        auditLog({
          companyId,
          userId: userId ?? 'system',
          action: 'SUBSCRIPTION_ACTIVATED_SYNC',
          entityType: 'Subscription',
          entityId: subscriptionId,
          metadata: { planId, stripeSessionId: session.id, stripeSubscriptionId },
        });

        logger.info(`[Billing] Sync verification: Subscription ${subscriptionId} ACTIVATED → plan ${planId}`);
      }
    }
  }

  sendSuccess(res, { verified: true }, 'Checkout session verified');
});
