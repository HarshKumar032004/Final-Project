import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { requirePlan } from '../middleware/plan.middleware';
import { UserRole, PlanType } from '../types/enums';
import { authorize } from '../middleware/authorize.middleware';
import {
  getProfile,
  updateProfile,
  getCompany,
  updateCompany,
  getApiKeys,
  generateApiKey,
  revokeApiKey,
  getAuditLogs
} from '../controllers/settings.controller';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

// ─── PROFILE ROUTES ───────────────────────────────────────────────────────────
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// ─── COMPANY ROUTES ───────────────────────────────────────────────────────────
// Only COMPANY_ADMIN can manage company details
router.get('/company', authorize(UserRole.COMPANY_ADMIN), getCompany);
router.patch('/company', authorize(UserRole.COMPANY_ADMIN), updateCompany);

// ─── ENTERPRISE ROUTES (API KEYS & AUDIT) ─────────────────────────────────────
// Only COMPANY_ADMIN on ENTERPRISE plan can access these
router.get(
  '/api-keys', 
  authorize(UserRole.COMPANY_ADMIN), 
  requirePlan([PlanType.ENTERPRISE]), 
  getApiKeys
);

router.post(
  '/api-keys', 
  authorize(UserRole.COMPANY_ADMIN), 
  requirePlan([PlanType.ENTERPRISE]), 
  generateApiKey
);

router.delete(
  '/api-keys/:keyId', 
  authorize(UserRole.COMPANY_ADMIN), 
  requirePlan([PlanType.ENTERPRISE]), 
  revokeApiKey
);

router.get(
  '/audit', 
  authorize(UserRole.COMPANY_ADMIN), 
  requirePlan([PlanType.ENTERPRISE]), 
  getAuditLogs
);

export const settingsRoutes = router;
