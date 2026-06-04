// =============================================================================
// JWT UTILITIES
// Strict helpers for signing and verifying access + refresh tokens.
// Uses asymmetric approach internally (secrets are treated as strong HMAC keys).
// =============================================================================

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtAccessPayload, JwtRefreshPayload, AuthTokens } from '../types/interfaces';
import { UserRole } from '../types/enums';

// ─── Sign Access Token ────────────────────────────────────────────────────────
export function signAccessToken(payload: Omit<JwtAccessPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as unknown as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign(payload, config.jwt.accessSecret, options);
}

// ─── Sign Refresh Token ───────────────────────────────────────────────────────
export function signRefreshToken(userId: string): string {
  const payload: JwtRefreshPayload = { sub: userId };
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as unknown as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
}

// ─── Sign Both Tokens ─────────────────────────────────────────────────────────
export function generateAuthTokens(
  userId: string,
  email: string,
  role: UserRole,
  companyId: string
): AuthTokens {
  const accessPayload: Omit<JwtAccessPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    role,
    companyId,
  };
  return {
    accessToken: signAccessToken(accessPayload),
    refreshToken: signRefreshToken(userId),
  };
}

// ─── Verify Access Token ──────────────────────────────────────────────────────
export function verifyAccessToken(token: string): JwtAccessPayload {
  const payload = jwt.verify(token, config.jwt.accessSecret, {
    algorithms: ['HS256'],
  }) as JwtPayload & JwtAccessPayload;

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.role !== 'string' ||
    typeof payload.companyId !== 'string'
  ) {
    throw new Error('Invalid token payload structure');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role as UserRole,
    companyId: payload.companyId,
    iat: payload.iat,
    exp: payload.exp,
  };
}

// ─── Verify Refresh Token ─────────────────────────────────────────────────────
export function verifyRefreshToken(token: string): JwtRefreshPayload {
  const payload = jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
  }) as JwtPayload & JwtRefreshPayload;

  if (typeof payload.sub !== 'string') {
    throw new Error('Invalid refresh token payload');
  }

  return {
    sub: payload.sub,
    iat: payload.iat,
    exp: payload.exp,
  };
}

// ─── Token Expiry Helper ──────────────────────────────────────────────────────
export function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: config.server.isProduction,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/v1/auth/refresh',
  };
}
