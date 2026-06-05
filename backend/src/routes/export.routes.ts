import { Router } from 'express';
import { exportCSV, exportPDF } from '../controllers/export.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { requirePlan } from '../middleware/plan.middleware';
import { PlanType } from '../types/enums';

const router = Router();

// Apply authentication to all export routes
router.use(authenticate);

// ─── Export Routes ────────────────────────────────────────────────────────────

// GET /api/v1/export/csv -> Available to all plans
router.get('/csv', exportCSV);

// GET /api/v1/export/pdf -> Pro/Enterprise only
router.get('/pdf', requirePlan([PlanType.PRO, PlanType.ENTERPRISE]), exportPDF);

export default router;
