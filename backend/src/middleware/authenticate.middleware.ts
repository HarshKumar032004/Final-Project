// =============================================================================
// AUTHENTICATION MIDDLEWARE
// Verifies the JWT access token on protected routes.
// Attaches the decoded payload as `req.user` for downstream use.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { JwtAccessPayload } from '../types/interfaces';
import { HttpStatus } from '../types/enums';
import logger from '../utils/logger';

// Extend the Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}

// ─── authenticate ─────────────────────────────────────────────────────────────
/**
 * Middleware that enforces JWT authentication.
 *
 * Expects:  Authorization: Bearer <access_token>
 * Attaches: req.user = decoded JWT payload
 *
 * Usage:  router.get('/protected', authenticate, handler)
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error: unknown) {
    const isExpired =
      error instanceof Error && error.message.includes('expired');

    logger.warn(`[Auth] Token verification failed: ${(error as Error).message}`);

    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: isExpired
        ? 'Session expired. Please log in again.'
        : 'Invalid or malformed token.',
    });
  }
}

// ─── optionalAuthenticate ─────────────────────────────────────────────────────
/**
 * Same as authenticate but doesn't reject unauthenticated requests.
 * Useful for routes that behave differently for logged-in users.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      req.user = verifyAccessToken(token);
    }
  } catch {
    // Silently ignore — treat as unauthenticated
  }
  next();
}
