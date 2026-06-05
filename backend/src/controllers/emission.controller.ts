// =============================================================================
// EMISSION RECORD CONTROLLER — Phase 2
// Full CRUD for GHG emission data with automatic CO2e calculation.
//
// Business Rule: calculatedCO2e = amount × emissionFactor
// This is computed server-side on Create and recalculated on any Update
// that changes amount or emissionFactor.
// =============================================================================

import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus, EmissionScope, EmissionCategory, PlanType } from '../types/enums';
import type { CreateEmissionInput, UpdateEmissionInput, EmissionQueryInput } from '../types/schemas';
import { logAction } from '../services/audit.service';
import logger from '../utils/logger';

// ─── POST /emissions — Create a new emission record ──────────────────────────
export const createEmission = asyncHandler(async (req: Request, res: Response) => {
  const {
    scope,
    category,
    description,
    amount,
    unit,
    emissionFactor,
    dateLogged,
    evidenceUrl,
  } = req.body as CreateEmissionInput;

  // ── Auto-calculate CO2e ─────────────────────────────────────────────────────
  // GHG Protocol standard: calculatedCO2e (kgCO2e) = activity amount × emission factor
  const calculatedCO2e = parseFloat((amount * emissionFactor).toFixed(4));
  
  // ── Plan Limits Gatekeeping ──────────────────────────────────────────────────
  const subscription = await prisma.subscription.findUnique({
    where: { companyId: req.user!.companyId },
    select: { planType: true },
  });

  if (subscription?.planType === PlanType.STARTER) {
    if (scope === EmissionScope.SCOPE_3) {
      void logAction({
        companyId: req.user!.companyId,
        userId: req.user!.sub,
        action: 'LIMIT_VIOLATION',
        entityType: 'EmissionScope',
        metadata: { reason: 'Scope 3 tracking requires the Pro plan.', scope },
        req,
      });
      throw new AppError('Scope 3 tracking requires the Pro plan.', HttpStatus.FORBIDDEN);
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const currentMonthLogs = await prisma.emissionRecord.count({
      where: {
        companyId: req.user!.companyId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    if (currentMonthLogs >= 100) {
      void logAction({
        companyId: req.user!.companyId,
        userId: req.user!.sub,
        action: 'LIMIT_VIOLATION',
        entityType: 'MonthlyLogLimit',
        metadata: { reason: 'Monthly log limit reached.', limit: 100, current: currentMonthLogs },
        req,
      });
      throw new AppError('Monthly log limit reached. Please upgrade your plan.', HttpStatus.FORBIDDEN);
    }
  }

  const record = await prisma.emissionRecord.create({
    data: {
      companyId: req.user!.companyId,
      loggedById: req.user!.sub,
      scope: scope as EmissionScope,
      category: category as EmissionCategory,
      description,
      amount,
      unit,
      emissionFactor,
      calculatedCO2e,
      dateLogged: dateLogged ?? new Date(),
      evidenceUrl,
    },
    include: {
      loggedBy: { select: { name: true, email: true } },
    },
  });

  logger.info(
    `[Emission] Created: ${record.id} | ${record.scope} | ${record.calculatedCO2e} kgCO2e | by ${req.user!.email}`
  );

  // Background audit log
  void logAction({
    companyId: req.user!.companyId,
    userId: req.user!.sub,
    action: 'CREATE_EMISSION',
    entityType: 'EmissionRecord',
    entityId: record.id,
    metadata: { scope, category, calculatedCO2e },
    req,
  });

  sendCreated(res, record, `Emission recorded: ${calculatedCO2e} kgCO2e`);
});

// ─── GET /emissions — List with filters, pagination, and aggregates ───────────
export const listEmissions = asyncHandler(async (req: Request, res: Response) => {
  const {
    scope,
    category,
    from,
    to,
    page = 1,
    limit = 20,
  } = req.query as unknown as EmissionQueryInput;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build dynamic where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    companyId: req.user!.companyId,
    ...(scope && { scope: scope as EmissionScope }),
    ...(category && { category: category as EmissionCategory }),
    ...(from || to
      ? {
          dateLogged: {
            ...(from && { gte: new Date(from as string) }),
            ...(to && { lte: new Date(to as string) }),
          },
        }
      : {}),
  };

  // Execute count + records in parallel for efficiency
  const [total, records] = await prisma.$transaction([
    prisma.emissionRecord.count({ where }),
    prisma.emissionRecord.findMany({
      where,
      include: { loggedBy: { select: { name: true, email: true } } },
      orderBy: { dateLogged: 'desc' },
      skip,
      take: limitNum,
    }),
  ]);

  // Aggregate total CO2e for current filter (single query)
  const aggregated = await prisma.emissionRecord.aggregate({
    where,
    _sum: { calculatedCO2e: true },
    _avg: { calculatedCO2e: true },
  });

  sendSuccess(res, {
    items: records,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    summary: {
      totalCO2e: parseFloat((aggregated._sum.calculatedCO2e ?? 0).toFixed(4)),
      avgCO2e: parseFloat((aggregated._avg.calculatedCO2e ?? 0).toFixed(4)),
      unit: 'kgCO2e',
    },
  }, 'Emissions retrieved');
});

// ─── GET /emissions/summary — Aggregated breakdown by scope and category ──────
export const getEmissionSummary = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const { from, to } = req.query as { from?: string; to?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateFilter: any = {
    ...(from || to
      ? {
          dateLogged: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  // Parallel aggregation by scope and by category
  const [byScope, byCategory, totalAgg] = await prisma.$transaction([
    prisma.emissionRecord.groupBy({
      by: ['scope'],
      where: { companyId, ...dateFilter },
      _sum: { calculatedCO2e: true },
      _count: { _all: true },
      orderBy: { _sum: { calculatedCO2e: 'desc' } },
    }),
    prisma.emissionRecord.groupBy({
      by: ['category'],
      where: { companyId, ...dateFilter },
      _sum: { calculatedCO2e: true },
      _count: { _all: true },
      orderBy: { _sum: { calculatedCO2e: 'desc' } },
    }),
    prisma.emissionRecord.aggregate({
      where: { companyId, ...dateFilter },
      _sum: { calculatedCO2e: true },
      _count: { _all: true },
    }),
  ]);

  sendSuccess(res, {
    total: {
      co2e: parseFloat((totalAgg._sum.calculatedCO2e ?? 0).toFixed(4)),
      records: totalAgg._count._all,
      unit: 'kgCO2e',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    byScope: (byScope as any[]).map((s: any) => ({
      scope: s.scope,
      co2e: parseFloat(((s._sum?.calculatedCO2e) ?? 0).toFixed(4)),
      count: (s._count as { _all: number })._all ?? 0,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    byCategory: (byCategory as any[]).map((c: any) => ({
      category: c.category,
      co2e: parseFloat(((c._sum?.calculatedCO2e) ?? 0).toFixed(4)),
      count: (c._count as { _all: number })._all ?? 0,
    })),
  }, 'Emission summary retrieved');
});

// ─── GET /emissions/:id ───────────────────────────────────────────────────────
export const getEmissionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = await prisma.emissionRecord.findFirst({
    where: { id, companyId: req.user!.companyId },
    include: { loggedBy: { select: { name: true, email: true } } },
  });
  if (!record) throw new AppError('Emission record not found.', HttpStatus.NOT_FOUND);
  sendSuccess(res, record, 'Emission record retrieved');
});

// ─── PATCH /emissions/:id — Update and recalculate CO2e ──────────────────────
export const updateEmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as UpdateEmissionInput;

  const existing = await prisma.emissionRecord.findFirst({
    where: { id, companyId: req.user!.companyId },
  });
  if (!existing) throw new AppError('Emission record not found.', HttpStatus.NOT_FOUND);

  // Recalculate CO2e if amount or factor changed
  const newAmount = body.amount ?? existing.amount;
  const newFactor = body.emissionFactor ?? existing.emissionFactor;
  const newCO2e = parseFloat((newAmount * newFactor).toFixed(4));

  const updated = await prisma.emissionRecord.update({
    where: { id },
    data: {
      ...(body.scope && { scope: body.scope as EmissionScope }),
      ...(body.category && { category: body.category as EmissionCategory }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.unit && { unit: body.unit }),
      ...(body.emissionFactor !== undefined && { emissionFactor: body.emissionFactor }),
      calculatedCO2e: newCO2e, // Always recompute
      ...(body.dateLogged && { dateLogged: body.dateLogged }),
      ...(body.evidenceUrl !== undefined && { evidenceUrl: body.evidenceUrl }),
    },
    include: { loggedBy: { select: { name: true, email: true } } },
  });

  // Background audit log
  void logAction({
    companyId: req.user!.companyId,
    userId: req.user!.sub,
    action: 'UPDATE_EMISSION',
    entityType: 'EmissionRecord',
    entityId: id,
    metadata: { oldCO2e: existing.calculatedCO2e, newCO2e },
    req,
  });

  sendSuccess(res, updated, `Emission updated: ${newCO2e} kgCO2e`);
});

// ─── DELETE /emissions/:id ────────────────────────────────────────────────────
export const deleteEmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.emissionRecord.findFirst({
    where: { id, companyId: req.user!.companyId },
  });
  if (!existing) throw new AppError('Emission record not found.', HttpStatus.NOT_FOUND);

  await prisma.emissionRecord.delete({ where: { id } });

  logger.info(`[Emission] Deleted: ${id} by ${req.user!.email}`);

  // Background audit log
  void logAction({
    companyId: req.user!.companyId,
    userId: req.user!.sub,
    action: 'DELETE_EMISSION',
    entityType: 'EmissionRecord',
    entityId: id,
    metadata: { scope: existing.scope, amount: existing.amount },
    req,
  });

  sendNoContent(res);
});

// ─── GET /emissions/export ────────────────────────────────────────────────────
export const exportEmissions = asyncHandler(async (req: Request, res: Response) => {
  const {
    scope,
    category,
    from,
    to,
    format = 'csv', // 'csv' or 'pdf'
  } = req.query as { scope?: string; category?: string; from?: string; to?: string; format?: string };

  const companyId = req.user!.companyId;

  // Build dynamic where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    companyId,
    ...(scope && { scope: scope as EmissionScope }),
    ...(category && { category: category as EmissionCategory }),
    ...(from || to
      ? {
          dateLogged: {
            ...(from && { gte: new Date(from as string) }),
            ...(to && { lte: new Date(to as string) }),
          },
        }
      : {}),
  };

  const records = await prisma.emissionRecord.findMany({
    where,
    include: { loggedBy: { select: { name: true, email: true } } },
    orderBy: { dateLogged: 'desc' },
  });

  if (format === 'csv') {
    const { Parser } = await import('json2csv');
    const fields = ['id', 'scope', 'category', 'description', 'amount', 'unit', 'emissionFactor', 'calculatedCO2e', 'dateLogged', 'loggedBy.name', 'loggedBy.email'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(records);

    res.header('Content-Type', 'text/csv');
    res.attachment(`emissions_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  }

  if (format === 'pdf') {
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.header('Content-Type', 'application/pdf');
    res.attachment(`emissions_export_${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Emission Records Export', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    records.forEach((record, index) => {
      doc.fontSize(14).text(`Record #${index + 1} - ${record.id}`);
      doc.fontSize(10).text(`Scope: ${record.scope} | Category: ${record.category}`);
      doc.text(`Amount: ${record.amount} ${record.unit} | Factor: ${record.emissionFactor}`);
      doc.text(`Calculated CO2e: ${record.calculatedCO2e} kgCO2e`);
      doc.text(`Date: ${record.dateLogged.toLocaleString()}`);
      doc.text(`Logged By: ${record.loggedBy.name} (${record.loggedBy.email})`);
      if (record.description) doc.text(`Description: ${record.description}`);
      doc.moveDown();
    });

    doc.end();
    return;
  }

  throw new AppError('Invalid export format requested. Use csv or pdf.', HttpStatus.BAD_REQUEST);
});
