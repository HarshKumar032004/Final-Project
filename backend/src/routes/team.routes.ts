import { Router } from 'express';
import { inviteMember } from '../controllers/team.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { adminOnly } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { inviteRateLimiter } from '../middleware/rateLimiter.middleware';
import { InviteMemberSchema } from '../types/schemas';

const router = Router();

// Only COMPANY_ADMIN can invite new members
router.post('/invite', authenticate, adminOnly, inviteRateLimiter, validate(InviteMemberSchema), inviteMember);

export default router;
