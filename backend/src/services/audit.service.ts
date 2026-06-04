// =============================================================================
// AUDIT SERVICE
// Asynchronously logs all significant state mutations to the AuditLog table.
// =============================================================================

import { Request } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export interface AuditLogParams {
  companyId: string;
  userId: string;
  action: string;       // e.g. "CREATE_EMISSION", "UPDATE_USER_ROLE"
  entityType: string;   // e.g. "EmissionRecord", "Company"
  entityId?: string;    // ID of the affected resource
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;       // Before/after state, changes, etc.
  req?: Request;        // Passed to extract IP and User-Agent automatically
}

/**
 * Fire-and-forget audit logger. Designed to NEVER block or crash the main 
 * HTTP response if it fails.
 */
export const logAction = async ({
  companyId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
  req,
}: AuditLogParams): Promise<void> => {
  try {
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (req) {
      // Trust x-forwarded-for if behind a proxy, fallback to req.socket.remoteAddress
      ipAddress = req.ip || req.socket.remoteAddress;
      userAgent = req.get('user-agent');
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata || undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Critical: Catch everything. Do not throw. We don't want to break
    // the user's primary mutation just because the audit log failed.
    logger.error(`[AuditService] Failed to record audit log for ${action}`, error);
  }
};
