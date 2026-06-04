// =============================================================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// Must be registered LAST in the Express middleware chain.
// Catches all errors passed via next(error) from async route handlers.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../types/enums';
import { config } from '../config/env';
import logger from '../utils/logger';

// ─── Custom Application Error ─────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish operational from programming errors
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Async Route Wrapper ──────────────────────────────────────────────────────
/**
 * Wraps async route handlers to catch unhandled promise rejections
 * and forward them to Express's global error handler.
 *
 * @example
 * router.get('/route', asyncHandler(async (req, res) => {
 *   // No try/catch needed!
 *   const data = await someService.getData();
 *   res.json(data);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default values
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected server error occurred.';
  let errors: Record<string, string[]> | undefined;

  // Handle known operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    message = 'Validation failed';
    // Cast to any to access Mongoose-specific properties
    const mongooseErr = err as unknown as { errors: Record<string, { message: string }> };
    errors = Object.fromEntries(
      Object.entries(mongooseErr.errors).map(([field, e]) => [field, [e.message]])
    );
  }

  // Handle Mongoose duplicate key errors
  if ((err as NodeJS.ErrnoException).code === 'E11000' || err.name === 'MongoServerError') {
    statusCode = HttpStatus.CONFLICT;
    message = 'A record with this value already exists.';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = 'Session expired. Please log in again.';
  }

  // Log all 5xx errors
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route '${req.method} ${req.originalUrl}' not found.`, HttpStatus.NOT_FOUND));
}
