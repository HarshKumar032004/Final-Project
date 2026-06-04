// =============================================================================
// ADMIN ROUTES — Phase 8
// =============================================================================

import { Router } from 'express';
import { getAuditLogs, getPlatformMetrics } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { adminOnly } from '../middleware/authorize.middleware';

const router = Router();

router.use(authenticate);
router.use(adminOnly); // Strict role gating

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get paginated audit logs for the company
 * @access  Company Admin
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @route   GET /api/v1/admin/metrics
 * @desc    Get global cross-tenant platform metrics
 * @access  Company Admin (Super Admin)
 */
router.get('/metrics', getPlatformMetrics);

export default router;
