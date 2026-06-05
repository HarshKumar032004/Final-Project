// =============================================================================
// PLAN-BASED AUTHORIZATION MIDDLEWARE
// Restricts access to routes based on the company's active subscription plan.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { HttpStatus, PlanType } from '../types/enums';
import prisma from '../config/database';
import logger from '../utils/logger';
import { logAction } from '../services/audit.service';

/**
 * Middleware to enforce subscription plan restrictions.
 * MUST be used AFTER `authenticate` middleware.
 *
 * @param allowedPlans - Array of `PlanType`s allowed to access this route.
 */
export function requirePlan(allowedPlans: PlanType[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.companyId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required to verify subscription plan.',
        });
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { companyId: req.user.companyId },
        select: { planType: true },
      });

      if (!subscription) {
        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'No active subscription found.',
        });
        return;
      }

      const currentPlan = subscription.planType as PlanType;

      if (!allowedPlans.includes(currentPlan)) {
        logger.warn(
          `[Plan Guard] Access denied — Company ${req.user.companyId} has plan '${currentPlan}' ` +
          `but route requires: [${allowedPlans.join(', ')}]`
        );

        logAction({
          companyId: req.user.companyId,
          userId: req.user.sub,
          action: 'LIMIT_VIOLATION',
          entityType: 'PlanLimit',
          metadata: {
            reason: 'Plan insufficient for requested route.',
            currentPlan,
            requiredPlans: allowedPlans,
            path: req.originalUrl
          },
          req,
        });

        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: `Upgrade your plan to unlock this feature.`,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
