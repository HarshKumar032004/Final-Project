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

export default router;
