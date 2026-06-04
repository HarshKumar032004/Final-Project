// =============================================================================
// API RESPONSE HELPERS
// Consistent success/error response shapes across all controllers.
// =============================================================================

import { Response } from 'express';
import { HttpStatus } from '../types/enums';
import { ApiSuccess, ApiError } from '../types/interfaces';

// ─── Success ──────────────────────────────────────────────────────────────────
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: number = HttpStatus.OK
): Response<ApiSuccess<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

// ─── Created ──────────────────────────────────────────────────────────────────
export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): Response<ApiSuccess<T>> {
  return sendSuccess(res, data, message, HttpStatus.CREATED);
}

// ─── No Content ───────────────────────────────────────────────────────────────
export function sendNoContent(res: Response): Response {
  return res.status(HttpStatus.NO_CONTENT).send();
}

// ─── Error ────────────────────────────────────────────────────────────────────
export function sendError(
  res: Response,
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  errors?: Record<string, string[]>
): Response<ApiError> {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}
