// =============================================================================
// COMPANY ROUTES
// =============================================================================

import { Router } from 'express';
import { getMyCompany, getCompanyById, updateCompany } from '../controllers/company.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { adminOnly, allRoles } from '../middleware/authorize.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/companies/me
 * @desc    Get the current user's company
 * @access  All authenticated roles
 */
router.get('/me', allRoles, getMyCompany);

/**
 * @route   GET /api/v1/companies/:id
 * @desc    Get a specific company (must match user's company)
 * @access  Company Admin
 */
router.get('/:id', adminOnly, getCompanyById);

/**
 * @route   PATCH /api/v1/companies/:id
 * @desc    Update company details
 * @access  Company Admin only
 */
router.patch('/:id', adminOnly, updateCompany);

export default router;
