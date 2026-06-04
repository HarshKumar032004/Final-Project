// =============================================================================
// RBAC (Role-Based Access Control) MIDDLEWARE
// Works in conjunction with `authenticate` to restrict routes by user role.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { UserRole, HttpStatus } from '../types/enums';
import logger from '../utils/logger';

// ─── authorize ────────────────────────────────────────────────────────────────
/**
 * Higher-order middleware factory for role-based access control.
 *
 * MUST be used AFTER `authenticate` middleware.
 *
 * @param allowedRoles - One or more roles permitted to access the route.
 *
 * @example
 * // Only Company Admins can access billing routes
 * router.get('/billing', authenticate, authorize(UserRole.COMPANY_ADMIN), handler);
 *
 * @example
 * // Admins and Auditors can access reports
 * router.get('/reports', authenticate, authorize(UserRole.COMPANY_ADMIN, UserRole.AUDITOR), handler);
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Guard: authenticate must have run first
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required before authorization.',
      });
      return;
    }

    const { role, sub, email } = req.user;

    if (!allowedRoles.includes(role as UserRole)) {
      logger.warn(
        `[RBAC] Access denied — User ${email} (${sub}) has role '${role}' ` +
        `but route requires: [${allowedRoles.join(', ')}]`
      );

      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: `Access forbidden. Requires one of: [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
}

// ─── Pre-composed Guards (convenience shortcuts) ──────────────────────────────

/** Only Company Admins */
export const adminOnly = authorize(UserRole.COMPANY_ADMIN);

/** Admins and Data Contributors */
export const contributorOrAbove = authorize(
  UserRole.COMPANY_ADMIN,
  UserRole.DATA_CONTRIBUTOR
);

/** All authenticated roles (Admin, Contributor, Auditor) */
export const allRoles = authorize(
  UserRole.COMPANY_ADMIN,
  UserRole.DATA_CONTRIBUTOR,
  UserRole.AUDITOR
);

/** Admins and Auditors (read-heavy access for verification) */
export const auditorOrAdmin = authorize(
  UserRole.COMPANY_ADMIN,
  UserRole.AUDITOR
);
