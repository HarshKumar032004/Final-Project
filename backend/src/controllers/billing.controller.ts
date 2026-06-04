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
  [PlanType.STARTER]:    process.env.STRIPE_PRICE_STARTER    ?? 'price_starter_placeholder',
  [PlanType.PRO]:        process.env.STRIPE_PRICE_PRO        ?? 'price_pro_placeholder',
  [PlanType.ENTERPRISE]: process.env.STRIPE_PRICE_ENTERPRISE ?? 'price_enterprise_placeholder',
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

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status:  newStatus,
            endDate: periodEndDate,
          },
        });

        auditLog({
          companyId: dbSub.companyId,
          userId: 'stripe-webhook',
          action: 'SUBSCRIPTION_UPDATED',
          entityType: 'Subscription',
          entityId: dbSub.id,
          metadata: { stripeStatus: stripeSub.status, newStatus },
        });

        logger.info(`[Webhook] Subscription ${dbSub.id} → status ${newStatus}`);
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
