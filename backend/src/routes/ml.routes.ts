import { Router } from 'express';
import { getPredictions } from '../controllers/ml.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { requirePlan } from '../middleware/plan.middleware';
import { PlanType } from '../types/enums';

const router = Router();

router.use(authenticate);

// GET /api/v1/ml/predict -> Pro/Enterprise only
router.get('/predict', requirePlan([PlanType.PRO, PlanType.ENTERPRISE]), getPredictions);

export default router;
