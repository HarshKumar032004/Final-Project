// =============================================================================
// USER ROUTES
// =============================================================================

import { Router } from 'express';
import {
  getMe,
  getTeamMembers,
  inviteUser,
  updateUserRole,
  deactivateUser,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { adminOnly, allRoles } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { UpdateRoleSchema, UserIdParamSchema } from '../types/schemas';

const router = Router();

router.use(authenticate);

/** GET /api/v1/users/me — Own profile */
router.get('/me', allRoles, getMe);

/** GET /api/v1/users — List team (Admin only) */
router.get('/', adminOnly, getTeamMembers);

/** POST /api/v1/users — Invite member (Admin only) */
router.post('/', adminOnly, inviteUser);

/** PATCH /api/v1/users/:id/role — Change role (Admin only) */
router.patch('/:id/role', adminOnly, validate(UpdateRoleSchema), updateUserRole);

/** DELETE /api/v1/users/:id — Soft-deactivate (Admin only) */
router.delete('/:id', adminOnly, validate(UserIdParamSchema), deactivateUser);

export default router;
