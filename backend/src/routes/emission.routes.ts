// =============================================================================
// EMISSION ROUTES — Phase 2
// All routes require authentication; role-based access within routes.
// =============================================================================

import { Router } from 'express';
import {
  createEmission,
  listEmissions,
  getEmissionSummary,
  getEmissionById,
  updateEmission,
  deleteEmission,
  exportEmissions,
} from '../controllers/emission.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { contributorOrAbove, auditorOrAdmin } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  CreateEmissionSchema,
  UpdateEmissionSchema,
  EmissionQuerySchema,
  EmissionIdParamSchema,
} from '../types/schemas';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/emissions
 * @desc    Log a new emission record (CO2e auto-calculated)
 * @access  Company Admin, Data Contributor
 */
router.post('/', contributorOrAbove, validate(CreateEmissionSchema), createEmission);

/**
 * @route   GET /api/v1/emissions
 * @desc    List emissions with optional scope/category/date filters + pagination
 * @access  All authenticated roles
 */
router.get('/', validate(EmissionQuerySchema), listEmissions);

/**
 * @route   GET /api/v1/emissions/summary
 * @desc    Aggregated CO2e breakdown by scope and category
 * @access  Company Admin, Auditor
 */
router.get('/summary', auditorOrAdmin, getEmissionSummary);

/**
 * @route   GET /api/v1/emissions/export
 * @desc    Export emissions as CSV or PDF
 * @access  All authenticated roles
 */
router.get('/export', validate(EmissionQuerySchema), exportEmissions);

/**
 * @route   GET /api/v1/emissions/:id
 * @desc    Get a single emission record by ID
 * @access  All authenticated roles
 */
router.get('/:id', validate(EmissionIdParamSchema), getEmissionById);

/**
 * @route   PATCH /api/v1/emissions/:id
 * @desc    Update an emission record (recalculates CO2e automatically)
 * @access  Company Admin, Data Contributor
 */
router.patch('/:id', contributorOrAbove, validate(UpdateEmissionSchema), updateEmission);

/**
 * @route   DELETE /api/v1/emissions/:id
 * @desc    Delete an emission record
 * @access  Company Admin only
 */
router.delete('/:id', validate(EmissionIdParamSchema), deleteEmission);

export default router;
