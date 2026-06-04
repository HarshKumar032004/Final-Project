// =============================================================================
// ANALYTICS ROUTES — Phase 3
// Provides dashboard aggregations and time-series forecasting.
// =============================================================================

import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { auditorOrAdmin } from '../middleware/authorize.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Retrieves 12-month historical aggregations and 3-month mathematical forecasts
 * @access  Company Admin, Auditor
 */
router.get('/dashboard', auditorOrAdmin, getDashboardAnalytics);

export default router;
