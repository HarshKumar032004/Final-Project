// =============================================================================
// BILLING ROUTES — Phase 6
//
// WEBHOOK ARCHITECTURE — READ THIS CAREFULLY:
// Stripe webhook verification requires the raw request buffer.
// The webhook route is declared here but mounted in app.ts BEFORE
// express.json() using express.raw({ type: 'application/json' }).
//
// Mount order in app.ts:
//   1. app.post('/api/v1/billing/webhook', express.raw(...), handleStripeWebhook)
//   2. app.use(express.json())
//   3. app.use('/api/v1/billing', billingRoutes)   ← JSON routes
// =============================================================================

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { UserRole } from '../types/enums';
import {
  createCheckoutSession,
  getBillingSubscription,
  createPortalSession,
  getStripeStatus,
  getStripeInvoices,
  getUsageSummary,
  verifyCheckoutSession,
} from '../controllers/billing.controller';

const router = Router();

// All routes below this line require a valid JWT
router.use(authenticate);

// ─── GET /api/v1/billing/subscription ────────────────────────────────────────
// Returns current plan & status for the logged-in company.
// All roles can view their company's subscription.
router.get('/subscription', getBillingSubscription);

// ─── POST /api/v1/billing/create-checkout ────────────────────────────────────
// Creates a Stripe Checkout Session. Only Company Admins can initiate billing.
// Body: { planId: 'STARTER' | 'PRO' | 'ENTERPRISE' }
// Returns: { checkoutUrl: string, sessionId: string }
router.post(
  '/create-checkout',
  authorize(UserRole.COMPANY_ADMIN),
  createCheckoutSession
);

// ─── POST /api/v1/billing/create-portal ──────────────────────────────────────
// Creates a Stripe Customer Portal Session for managing subscriptions.
// Only Company Admins can access the portal.
// Returns: { portalUrl: string }
router.post(
  '/create-portal',
  authorize(UserRole.COMPANY_ADMIN),
  createPortalSession
);

// ─── GET /api/v1/billing/stripe/status ───────────────────────────────────────
// Fetches the live subscription status and dates from Stripe API.
router.get('/stripe/status', getStripeStatus);

// ─── GET /api/v1/billing/stripe/invoices ─────────────────────────────────────
// Fetches real invoices directly from Stripe API.
router.get('/stripe/invoices', getStripeInvoices);

// ─── GET /api/v1/billing/usage ───────────────────────────────────────────────
// Fetches real usage metrics from the database.
router.get('/usage', getUsageSummary);

// ─── POST /api/v1/billing/verify-checkout ────────────────────────────────────
// Synchronous checkout verification (called by frontend on success redirect)
router.post(
  '/verify-checkout',
  authorize(UserRole.COMPANY_ADMIN),
  verifyCheckoutSession
);

export default router;
