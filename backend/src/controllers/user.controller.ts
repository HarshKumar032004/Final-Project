// =============================================================================
// USER CONTROLLER — Phase 7 Update
// inviteUser now generates a secure crypto token instead of requiring a password.
// Invited users are created with isActive=false and must accept the invite to log in.
// =============================================================================

import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { sendSuccess, sendNoContent } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus, UserRole } from '../types/enums';
import type { SafeUser } from '../types/interfaces';
import { logAction } from '../services/audit.service';
import { sendInvitationEmail } from '../services/email.service';
import logger from '../utils/logger';

// ─── GET /users/me ────────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    include: { company: { select: { id: true, name: true, industry: true } } },
  });
  if (!user) throw new AppError('User not found.', HttpStatus.NOT_FOUND);

  const { password, refreshToken, inviteToken, resetToken, ...safe } = user;
  void password; void refreshToken; void inviteToken; void resetToken;
  sendSuccess(res, safe, 'Profile retrieved');
});

// ─── GET /users — Team members for current company ────────────────────────────
export const getTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { companyId: req.user!.companyId },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, lastLoginAt: true, createdAt: true,
      companyId: true, updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  sendSuccess(res, users, 'Team members retrieved');
});

// ─── POST /users — Invite a new team member ───────────────────────────────────
/**
 * Phase 7: Invite flow — no password required at invite time.
 * 1. Creates user with isActive=false and a 48-hour invite token.
 * 2. Sends an email with a secure activation link.
 * 3. User sets their password via POST /auth/accept-invite?token=...
 */
export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role } = req.body as {
    name: string;
    email: string;
    role: UserRole;
  };

  if (!name || !email || !role) {
    throw new AppError('name, email, and role are required.', HttpStatus.BAD_REQUEST);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already in use.', HttpStatus.CONFLICT);

  // Generate a cryptographically secure URL-safe token (48 random bytes → 64 hex chars)
  const inviteToken        = crypto.randomBytes(48).toString('hex');
  const inviteTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  // Temporary placeholder password — will be replaced when user accepts invite
  const bcrypt  = await import('bcryptjs');
  const dummyPw = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: dummyPw,
      role,
      isActive: false,           // Inactive until invite is accepted
      inviteToken,
      inviteTokenExpires,
      companyId: req.user!.companyId,
    },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, createdAt: true, companyId: true, updatedAt: true,
      lastLoginAt: true,
    },
  });

  // Fetch company name for the email
  const company = await prisma.company.findUnique({
    where: { id: req.user!.companyId },
    select: { name: true },
  });

  // Send invitation email (fire-and-forget — log but don't fail the API response)
  try {
    await sendInvitationEmail(email, name, company?.name ?? 'your company', inviteToken);
  } catch (emailErr: unknown) {
    const message = emailErr instanceof Error ? emailErr.message : 'Email failed';
    logger.error(`[User] Invitation email failed for ${email}: ${message}`);
    // Don't throw — the user record was created. Admin can resend manually.
  }

  logger.info(`[User] Invited: ${email} as ${role} by ${req.user!.email}`);

  void logAction({
    companyId: req.user!.companyId,
    userId: req.user!.sub,
    action: 'INVITE_USER',
    entityType: 'User',
    entityId: user.id,
    metadata: { invitedEmail: email, role },
    req,
  });

  sendSuccess(res, user, 'Invitation sent successfully', HttpStatus.CREATED);
});

// ─── PATCH /users/:id/role ────────────────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body as { role: UserRole };

  if (id === req.user!.sub) {
    throw new AppError('You cannot change your own role.', HttpStatus.BAD_REQUEST);
  }

  const user = await prisma.user.findFirst({
    where: { id, companyId: req.user!.companyId },
  });
  if (!user) throw new AppError('User not found in your organisation.', HttpStatus.NOT_FOUND);

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, createdAt: true, companyId: true, updatedAt: true,
      lastLoginAt: true,
    },
  });

  logger.info(`[User] Role updated: ${updated.email} → ${role} by ${req.user!.email}`);

  void logAction({
    companyId: req.user!.companyId,
    userId: req.user!.sub,
    action: 'UPDATE_USER_ROLE',
    entityType: 'User',
    entityId: id,
    metadata: { oldRole: user.role, newRole: role, affectedEmail: updated.email },
    req,
  });

  sendSuccess<Omit<SafeUser, 'password' | 'refreshToken'>>(res, updated, 'Role updated');
});

// ─── DELETE /users/:id — Soft-deactivate ─────────────────────────────────────
export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === req.user!.sub) {
    throw new AppError('Cannot deactivate your own account.', HttpStatus.BAD_REQUEST);
  }

  const user = await prisma.user.findFirst({
    where: { id, companyId: req.user!.companyId },
  });
  if (!user) throw new AppError('User not found.', HttpStatus.NOT_FOUND);

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  void logAction({
    companyId: req.user!.companyId,
    userId: req.user!.sub,
    action: 'DEACTIVATE_USER',
    entityType: 'User',
    entityId: id,
    metadata: { affectedEmail: user.email },
    req,
  });

  sendNoContent(res);
});
