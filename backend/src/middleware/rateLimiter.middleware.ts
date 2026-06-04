// =============================================================================
// RATE LIMITER MIDDLEWARE
// Protects auth endpoints from brute force attacks.
// =============================================================================

import rateLimit from 'express-rate-limit';
import { HttpStatus } from '../types/enums';

// ─── Auth Route Limiter ───────────────────────────────────────────────────────
// Strict: max 5 login attempts per 15 minutes per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// ─── General API Limiter ──────────────────────────────────────────────────────
// Relaxed: max 200 requests per 15 minutes per IP
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
});

// ─── Registration Limiter ─────────────────────────────────────────────────────
// Prevent abuse of the registration endpoint
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again later.',
  },
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
});
