// =============================================================================
// COMPANY CONTROLLER — Refactored for Prisma
// =============================================================================

import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus } from '../types/enums';
import type { UpdateCompanyDTO } from '../types/interfaces';
import { logAction } from '../services/audit.service';

// ─── GET /companies/me ────────────────────────────────────────────────────────
export const getMyCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await prisma.company.findUnique({
    where: { id: req.user!.companyId },
    include: {
      subscription: {
        select: { planType: true, status: true, trialEndDate: true, endDate: true },
      },
      _count: { select: { users: true, emissionRecords: true } },
    },
  });
  if (!company) throw new AppError('Company not found.', HttpStatus.NOT_FOUND);
  sendSuccess(res, company, 'Company retrieved');
});

// ─── GET /companies/:id ───────────────────────────────────────────────────────
export const getCompanyById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Tenant guard — you can only access your own company
  if (id !== req.user!.companyId) {
    throw new AppError('Access denied.', HttpStatus.FORBIDDEN);
  }
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      subscription: true,
      _count: { select: { users: true, emissionRecords: true } },
    },
  });
  if (!company) throw new AppError('Company not found.', HttpStatus.NOT_FOUND);
  sendSuccess(res, company, 'Company retrieved');
});

// ─── PATCH /companies/:id ─────────────────────────────────────────────────────
export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id !== req.user!.companyId) {
    throw new AppError('You can only update your own company.', HttpStatus.FORBIDDEN);
  }

  const { name, industry, totalEmployees, logoUrl, website } =
    req.body as UpdateCompanyDTO;

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(industry && {
        industry: industry as Parameters<typeof prisma.company.update>[0]['data']['industry'],
      }),
      ...(totalEmployees && { totalEmployees }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(website !== undefined && { website }),
    },
  });

  void logAction({
    companyId: req.user!.companyId,
    userId: req.user!.sub,
    action: 'UPDATE_COMPANY',
    entityType: 'Company',
    entityId: id,
    metadata: { updatedFields: Object.keys(req.body) },
    req,
  });

  sendSuccess(res, company, 'Company updated');
});
