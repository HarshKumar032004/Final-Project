// =============================================================================
// AUTH ROUTES — Phase 7 Update
// Added: accept-invite, forgot-password, reset-password
// =============================================================================

import { Router } from 'express';
import {
  register,
  login,
  refreshTokens,
  logout,
  activateInvite,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter.middleware';
import { validate } from '../middleware/validate.middleware';
import { RegisterSchema, LoginSchema } from '../types/schemas';

const router = Router();

/** POST /api/v1/auth/register */
router.post('/register', registrationRateLimiter, validate(RegisterSchema), register);

/** POST /api/v1/auth/login */
router.post('/login', authRateLimiter, validate(LoginSchema), login);

/** POST /api/v1/auth/refresh (cookie-based) */
router.post('/refresh', refreshTokens);

/** POST /api/v1/auth/logout */
router.post('/logout', authenticate, logout);

// ─── Phase 7: Onboarding & Recovery ──────────────────────────────────────────

/**
 * POST /api/v1/auth/accept-invite
 * Activates an invited user account and sets their password.
 * Body: { token: string, password: string, name?: string }
 * Public — no JWT required (user has no account yet).
 */
router.post('/accept-invite', authRateLimiter, activateInvite);

/**
 * POST /api/v1/auth/forgot-password
 * Sends a password reset email if account exists.
 * Body: { email: string }
 * Always returns 200 to prevent email enumeration.
 */
router.post('/forgot-password', authRateLimiter, forgotPassword);

/**
 * POST /api/v1/auth/reset-password
 * Validates the reset token and sets a new password.
 * Body: { token: string, password: string }
 */
router.post('/reset-password', authRateLimiter, resetPassword);

export default router;
