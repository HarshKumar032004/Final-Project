// =============================================================================
// SUBSCRIPTION CONTROLLER — Refactored for Prisma
// =============================================================================

import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendCreated } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus, PlanType, SubscriptionStatus } from '../types/enums';
import type { UpdateSubscriptionDTO } from '../types/interfaces';

// ─── GET /subscriptions/my ────────────────────────────────────────────────────
export const getMySubscription = asyncHandler(async (req: Request, res: Response) => {
  const sub = await prisma.subscription.findUnique({
    where: { companyId: req.user!.companyId },
    include: { company: { select: { name: true } } },
  });
  if (!sub) throw new AppError('No subscription found.', HttpStatus.NOT_FOUND);
  sendSuccess(res, sub, 'Subscription retrieved');
});

// ─── POST /subscriptions ─────────────────────────────────────────────────────
export const createSubscription = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.subscription.findUnique({
    where: { companyId: req.user!.companyId },
  });
  if (existing) {
    throw new AppError(
      'Subscription already exists for this company. Use PATCH to update.',
      HttpStatus.CONFLICT
    );
  }

  const { planType, endDate, trialEndDate, stripeCustomerId, razorpayCustomerId } = req.body as {
    planType?: PlanType;
    endDate?: Date;
    trialEndDate?: Date;
    stripeCustomerId?: string;
    razorpayCustomerId?: string;
  };

  const sub = await prisma.subscription.create({
    data: {
      companyId: req.user!.companyId,
      planType: planType ?? PlanType.STARTER,
      status: SubscriptionStatus.TRIALING,
      ...(endDate && { endDate }),
      ...(trialEndDate && { trialEndDate }),
      ...(stripeCustomerId && { stripeCustomerId }),
      ...(razorpayCustomerId && { razorpayCustomerId }),
    },
  });
  sendCreated(res, sub, 'Subscription created');
});

// ─── PATCH /subscriptions/:id ─────────────────────────────────────────────────
export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateSubscriptionDTO;

  // Verify subscription belongs to the user's company
  const existing = await prisma.subscription.findFirst({
    where: { id, companyId: req.user!.companyId },
  });
  if (!existing) throw new AppError('Subscription not found.', HttpStatus.NOT_FOUND);

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      ...(data.planType && {
        planType: data.planType as Parameters<
          typeof prisma.subscription.update
        >[0]['data']['planType'],
      }),
      ...(data.status && {
        status: data.status as Parameters<
          typeof prisma.subscription.update
        >[0]['data']['status'],
      }),
      ...(data.endDate && { endDate: data.endDate }),
      ...(data.stripeCustomerId && { stripeCustomerId: data.stripeCustomerId }),
      ...(data.stripeSubscriptionId && { stripeSubscriptionId: data.stripeSubscriptionId }),
      ...(data.razorpayCustomerId && { razorpayCustomerId: data.razorpayCustomerId }),
      ...(data.razorpaySubscriptionId && { razorpaySubscriptionId: data.razorpaySubscriptionId }),
    },
  });
  sendSuccess(res, updated, 'Subscription updated');
});

// ─── POST /subscriptions/cancel ───────────────────────────────────────────────
export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.subscription.findUnique({
    where: { companyId: req.user!.companyId },
  });
  if (!existing) throw new AppError('No subscription found.', HttpStatus.NOT_FOUND);

  const canceled = await prisma.subscription.update({
    where: { companyId: req.user!.companyId },
    data: { status: SubscriptionStatus.CANCELED, endDate: new Date() },
  });
  sendSuccess(res, canceled, 'Subscription canceled');
});
