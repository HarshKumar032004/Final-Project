// =============================================================================
// SUBSCRIPTION ROUTES
// Billing routes — Company Admin only. These manage SaaS plans.
// =============================================================================

import { Router } from 'express';
import {
  getMySubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { adminOnly } from '../middleware/authorize.middleware';

const router = Router();

// All subscription routes: must be authenticated AND Company Admin
router.use(authenticate, adminOnly);

/**
 * @route   GET /api/v1/subscriptions/my
 * @desc    Get subscription for the current user's company
 * @access  Company Admin
 */
router.get('/my', getMySubscription);

/**
 * @route   POST /api/v1/subscriptions
 * @desc    Create a new subscription record
 * @access  Company Admin
 */
router.post('/', createSubscription);

/**
 * @route   PATCH /api/v1/subscriptions/:id
 * @desc    Update plan type, status, or payment gateway IDs
 * @access  Company Admin
 */
router.patch('/:id', updateSubscription);

/**
 * @route   POST /api/v1/subscriptions/cancel
 * @desc    Cancel the company's active subscription
 * @access  Company Admin
 */
router.post('/cancel', cancelSubscription);

export default router;
