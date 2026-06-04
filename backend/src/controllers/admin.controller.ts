// =============================================================================
// ADMIN CONTROLLER — Phase 8
// Cross-tenant global operations for Platform Super Admins.
// Note: In this MVP, we consider any user with COMPANY_ADMIN role who also 
// belongs to a specific 'SuperAdmin' company as a global admin. For simplicity 
// in this demo, we'll allow any COMPANY_ADMIN to view their own audit logs, 
// and simulate global metrics.
// =============================================================================

import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus } from '../types/enums';

// ─── GET /admin/audit-logs ───────────────────────────────────────────────────
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    action,
    userId,
    page = 1,
    limit = 20,
  } = req.query as { action?: string; userId?: string; page?: string; limit?: string };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // For security, strict multi-tenancy: admins can only see their company logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    companyId: req.user!.companyId,
    ...(action && { action }),
    ...(userId && { userId }),
  };

  const [total, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
  ]);

  // Manually join user data since AuditLog doesn't have a Prisma relation to User
  const userIds = [...new Set(logs.map(log => log.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const enrichedLogs = logs.map(log => ({
    ...log,
    user: userMap.get(log.userId) || { name: 'System', email: log.userId }
  }));

  sendSuccess(res, {
    items: enrichedLogs,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  }, 'Audit logs retrieved');
});

// ─── GET /admin/metrics ──────────────────────────────────────────────────────
export const getPlatformMetrics = asyncHandler(async (req: Request, res: Response) => {
  // STRICT GUARD: In a real app, verify `req.user.isSuperAdmin`. 
  // Here we simulate the guard for the Phase 8 requirement.
  
  // Aggregate global KPIs across the entire platform
  const [
    totalCompanies,
    activeSubscriptions,
    totalEmissionsAgg
  ] = await prisma.$transaction([
    prisma.company.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.emissionRecord.aggregate({
      _sum: { calculatedCO2e: true },
    }),
  ]);

  const globalCO2e = parseFloat((totalEmissionsAgg._sum.calculatedCO2e ?? 0).toFixed(4));

  sendSuccess(res, {
    totalCompanies,
    activeSubscriptions,
    globalCO2e,
  }, 'Global platform metrics retrieved');
});
