// =============================================================================
// AUTH CONTROLLER — Phase 7 Update
// Added: activateInvite, forgotPassword, resetPassword
// =============================================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import {
  generateAuthTokens,
  verifyRefreshToken,
  getRefreshTokenCookieOptions,
} from '../utils/jwt.utils';
import { sendSuccess, sendCreated } from '../utils/response.utils';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus, UserRole, PlanType, SubscriptionStatus } from '../types/enums';
import type { RegisterInput, LoginInput } from '../types/schemas';
import type { SafeUser } from '../types/interfaces';
import { sendPasswordResetEmail } from '../services/email.service';
import logger from '../utils/logger';

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Helper — strip sensitive fields before returning user in API response
// ─────────────────────────────────────────────────────────────────────────────
function toSafeUser(user: { password: string; refreshToken: string | null; [key: string]: unknown }): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, refreshToken, inviteToken, inviteTokenExpires, resetToken, resetTokenExpires, ...safe } = user;
  return safe as SafeUser;
}

// ─── POST /auth/register ──────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    companyName, industry, registrationNumber,
    totalEmployees, name, email, password,
  } = req.body as RegisterInput;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', HttpStatus.CONFLICT);
  }

  const existingCompany = await prisma.company.findUnique({
    where: { registrationNumber: registrationNumber.toUpperCase() },
  });
  if (existingCompany) {
    throw new AppError('A company with this registration number already exists.', HttpStatus.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { company, user } = await prisma.$transaction(async (tx: any) => {
    const newCompany = await tx.company.create({
      data: {
        name: companyName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        industry: industry as any,
        registrationNumber: registrationNumber.toUpperCase(),
        totalEmployees,
      },
    });

    const newUser = await tx.user.create({
      data: {
        name, email,
        password: hashedPassword,
        role: UserRole.COMPANY_ADMIN,
        companyId: newCompany.id,
      },
    });

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    await tx.subscription.create({
      data: {
        companyId: newCompany.id,
        planType: PlanType.STARTER,
        status: SubscriptionStatus.TRIALING,
        trialEndDate,
      },
    });

    return { company: newCompany, user: newUser };
  });

  const tokens = generateAuthTokens(user.id, user.email, user.role as UserRole, company.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  res.cookie('refreshToken', tokens.refreshToken, getRefreshTokenCookieOptions());
  logger.info(`[Auth] Registered: ${company.name} / ${user.email}`);

  sendCreated(res, {
    accessToken: tokens.accessToken,
    user: toSafeUser(user as Parameters<typeof toSafeUser>[0]),
    company,
  }, 'Company and admin account created successfully');
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password.', HttpStatus.UNAUTHORIZED);
  }

  if (!user.isActive) {
    // Distinguish between deactivated and pending invite
    if (user.inviteToken) {
      throw new AppError(
        'Your account is pending activation. Please check your invitation email.',
        HttpStatus.FORBIDDEN
      );
    }
    throw new AppError('Account deactivated. Contact your Company Admin.', HttpStatus.FORBIDDEN);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', HttpStatus.UNAUTHORIZED);
  }

  const tokens = generateAuthTokens(user.id, user.email, user.role as UserRole, user.companyId);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken, lastLoginAt: new Date() },
  });

  res.cookie('refreshToken', tokens.refreshToken, getRefreshTokenCookieOptions());
  logger.info(`[Auth] Login: ${user.email} (${user.role})`);

  sendSuccess(res, {
    accessToken: tokens.accessToken,
    user: toSafeUser(user as Parameters<typeof toSafeUser>[0]),
  }, 'Login successful');
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
export const refreshTokens = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string | undefined>)['refreshToken'];
  if (!token) {
    throw new AppError('No refresh token provided.', HttpStatus.UNAUTHORIZED);
  }

  const payload = verifyRefreshToken(token);
  const user    = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user || user.refreshToken !== token) {
    throw new AppError('Invalid refresh token. Please log in again.', HttpStatus.UNAUTHORIZED);
  }

  const tokens = generateAuthTokens(user.id, user.email, user.role as UserRole, user.companyId);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  res.cookie('refreshToken', tokens.refreshToken, getRefreshTokenCookieOptions());
  sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  sendSuccess(res, null, 'Logged out successfully');
});

// =============================================================================
// POST /auth/accept-invite
// Body: { token: string, password: string, name?: string }
// Activates an invited user account by verifying the invite token and setting
// a real password. Returns a full auth token pair (auto-login on activation).
// =============================================================================
export const activateInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, password, name } = req.body as {
    token: string;
    password: string;
    name?: string;
  };

  if (!token || !password) {
    throw new AppError('token and password are required.', HttpStatus.BAD_REQUEST);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters.', HttpStatus.BAD_REQUEST);
  }

  // Find the user by invite token
  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
  });

  if (!user) {
    throw new AppError(
      'Invalid or expired invitation link. Please ask your admin to resend the invite.',
      HttpStatus.BAD_REQUEST
    );
  }

  // Check expiry
  if (!user.inviteTokenExpires || user.inviteTokenExpires < new Date()) {
    throw new AppError(
      'This invitation has expired (48-hour limit). Ask your admin to send a new invite.',
      HttpStatus.BAD_REQUEST
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const activatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      isActive: true,
      inviteToken: null,
      inviteTokenExpires: null,
      lastLoginAt: new Date(),
      ...(name && { name }),  // Allow updating name during activation
    },
  });

  // Issue auth tokens so the user is immediately logged in
  const tokens = generateAuthTokens(
    activatedUser.id,
    activatedUser.email,
    activatedUser.role as UserRole,
    activatedUser.companyId
  );

  await prisma.user.update({
    where: { id: activatedUser.id },
    data: { refreshToken: tokens.refreshToken },
  });

  res.cookie('refreshToken', tokens.refreshToken, getRefreshTokenCookieOptions());
  logger.info(`[Auth] Invite accepted: ${activatedUser.email}`);

  sendSuccess(res, {
    accessToken: tokens.accessToken,
    user: toSafeUser(activatedUser as Parameters<typeof toSafeUser>[0]),
  }, 'Account activated successfully. Welcome to CarbonTrack!');
});

// =============================================================================
// POST /auth/forgot-password
// Body: { email: string }
// Sends a password reset email if the account exists.
// Always returns 200 to prevent email enumeration.
// =============================================================================
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  if (!email) {
    throw new AppError('Email is required.', HttpStatus.BAD_REQUEST);
  }

  // Always respond with success — do not reveal whether account exists
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (user && user.isActive) {
    const resetToken        = crypto.randomBytes(48).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr: unknown) {
      const message = emailErr instanceof Error ? emailErr.message : 'Email failed';
      logger.error(`[Auth] Password reset email failed for ${email}: ${message}`);
      // Don't expose email failure to client
    }

    logger.info(`[Auth] Password reset requested for ${email}`);
  } else {
    // Log the miss for monitoring (potential enumeration attempt), but respond normally
    logger.info(`[Auth] Forgot-password attempted for unknown/inactive email: ${email}`);
  }

  sendSuccess(
    res,
    null,
    'If an account with that email exists, a password reset link has been sent.'
  );
});

// =============================================================================
// POST /auth/reset-password
// Body: { token: string, password: string }
// Validates the reset token and sets the new password.
// =============================================================================
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };

  if (!token || !password) {
    throw new AppError('token and password are required.', HttpStatus.BAD_REQUEST);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters.', HttpStatus.BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { resetToken: token },
  });

  if (!user) {
    throw new AppError(
      'Invalid or expired password reset link. Please request a new one.',
      HttpStatus.BAD_REQUEST
    );
  }

  if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new AppError(
      'This reset link has expired (1-hour limit). Please request a new password reset.',
      HttpStatus.BAD_REQUEST
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
      refreshToken: null, // Invalidate all existing sessions
    },
  });

  logger.info(`[Auth] Password reset completed for ${user.email}`);

  sendSuccess(
    res,
    null,
    'Password reset successfully. Please log in with your new password.'
  );
});
