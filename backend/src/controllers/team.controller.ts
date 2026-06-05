import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { sendSuccess } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus, PlanType } from '../types/enums';
import { sendInvitationEmail } from '../services/email.service';
import logger from '../utils/logger';
import { logAction } from '../services/audit.service';

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, role } = req.body;
  const adminId = req.user?.sub;
  const companyId = req.user?.companyId;

  if (!email || !name || !role) {
    throw new AppError('Email, name, and role are required', HttpStatus.BAD_REQUEST);
  }

  if (!adminId || !companyId) {
    throw new AppError('Unauthorized access', HttpStatus.UNAUTHORIZED);
  }

  // ── Plan Limits Gatekeeping ──────────────────────────────────────────────────
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    select: { planType: true },
  });

  if (subscription?.planType === PlanType.STARTER) {
    // Count active members and pending invites
    const memberCount = await prisma.user.count({
      where: { companyId },
    });

    if (memberCount >= 5) {
      void logAction({
        companyId,
        userId: adminId,
        action: 'LIMIT_VIOLATION',
        entityType: 'TeamMemberLimit',
        metadata: { reason: 'Team member limit reached.', limit: 5, current: memberCount },
        req,
      });
      throw new AppError('Team member limit reached. Please upgrade your plan.', HttpStatus.FORBIDDEN);
    }
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.companyId !== companyId) {
      throw new AppError('This email is already associated with another workspace.', HttpStatus.CONFLICT);
    }
    
    if (existingUser.isActive) {
      throw new AppError('User is already an active member of your team.', HttpStatus.CONFLICT);
    } else {
      throw new AppError('User has already been invited but has not accepted yet. (Resend feature coming soon)', HttpStatus.CONFLICT);
    }
  }

  // Get company info for the email
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError('Company not found', HttpStatus.NOT_FOUND);
  }

  // Generate secure token
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  // Dummy password (user will reset it upon accepting invite)
  const dummyPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(dummyPassword, 12);

  // Create pending user
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      role,
      password: hashedPassword,
      companyId,
      isActive: false, // Important: wait for invite acceptance
      inviteToken,
      inviteTokenExpires: tokenExpires,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      companyId,
      userId: adminId,
      action: 'MEMBER_INVITED',
      entityType: 'User',
      entityId: newUser.id,
      metadata: { role, email },
    },
  });

  // Send invitation email
  try {
    await sendInvitationEmail(email, name, company.name, inviteToken);
  } catch (error) {
    logger.error(`Failed to send invite email to ${email}`, error);
    // Even if email fails, we shouldn't fully fail the request but maybe we should rollback?
    // For now, let's keep the user but alert the caller.
    throw new AppError('Invitation created but email delivery failed. They can use the reset password flow.', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  sendSuccess(res, {
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, isActive: newUser.isActive },
  }, 'Invitation sent successfully', HttpStatus.CREATED);
});
