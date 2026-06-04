// =============================================================================
// ZOD VALIDATION MIDDLEWARE
// Validates req.body, req.params, and req.query against a Zod schema.
// On failure, returns a structured 422 with field-level error messages.
// Usage:  router.post('/route', validate(MySchema), controller)
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpStatus } from '../types/enums';

// ─── Validate Factory ─────────────────────────────────────────────────────────
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Merge parsed (coerced/transformed) values back onto the request
    if (result.data.body !== undefined) {
      req.body = result.data.body as Record<string, unknown>;
    }
    if (result.data.query !== undefined) {
      req.query = result.data.query as Record<string, string>;
    }
    // Note: req.params is read-only in Express — coercion happens in controller

    next();
  };
}

// ─── Format Zod errors into { field: [messages] } ─────────────────────────────
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const issue of error.issues) {
    // Strip "body." / "params." / "query." prefix for cleaner client output
    const rawPath = issue.path.join('.');
    const field = rawPath.replace(/^(body|params|query)\.?/, '') || 'root';

    if (!grouped[field]) {
      grouped[field] = [];
    }
    grouped[field].push(issue.message);
  }

  return grouped;
}
