// =============================================================================
// ZOD VALIDATION SCHEMAS
// Single source of truth for all request body/query validation.
// Import these into the `validate` middleware — never do manual req.body checks.
// =============================================================================

import { z } from 'zod';
import { UserRole, Industry, EmissionScope, EmissionCategory, PlanType } from './enums';

// ─── Re-usable Primitives ─────────────────────────────────────────────────────
const cuid = z.string().cuid({ message: 'Invalid ID format' });
const isoDate = z.coerce.date({ invalid_type_error: 'Invalid date format' });
const url = z.string().url({ message: 'Must be a valid URL' }).optional();

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  body: z.object({
    // Company
    companyName: z.string().min(2).max(100).trim(),
    industry: z.nativeEnum(Industry, {
      errorMap: () => ({ message: `Must be one of: ${Object.values(Industry).join(', ')}` }),
    }),
    registrationNumber: z.string().min(3).max(30).trim().toUpperCase(),
    totalEmployees: z.number().int().positive().max(1_000_000),
    // User
    name: z.string().min(2).max(80).trim(),
    email: z.string().email({ message: 'Invalid email address' }).toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }).toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

// ─── User Schemas ─────────────────────────────────────────────────────────────
export const UpdateRoleSchema = z.object({
  params: z.object({ id: cuid }),
  body: z.object({
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: `Must be one of: ${Object.values(UserRole).join(', ')}` }),
    }),
  }),
});

export const UserIdParamSchema = z.object({
  params: z.object({ id: cuid }),
});

// ─── Company Schemas ──────────────────────────────────────────────────────────
export const UpdateCompanySchema = z.object({
  params: z.object({ id: cuid }),
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    industry: z.nativeEnum(Industry).optional(),
    totalEmployees: z.number().int().positive().max(1_000_000).optional(),
    logoUrl: url,
    website: url,
  }),
});

// ─── Subscription Schemas ─────────────────────────────────────────────────────
export const CreateSubscriptionSchema = z.object({
  body: z.object({
    planType: z.nativeEnum(PlanType).optional(),
    endDate: isoDate.optional(),
    trialEndDate: isoDate.optional(),
    stripeCustomerId: z.string().optional(),
    razorpayCustomerId: z.string().optional(),
  }),
});

export const UpdateSubscriptionSchema = z.object({
  params: z.object({ id: cuid }),
  body: z.object({
    planType: z.nativeEnum(PlanType).optional(),
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
    razorpayCustomerId: z.string().optional(),
    razorpaySubscriptionId: z.string().optional(),
    endDate: isoDate.optional(),
  }),
});

// ─── Emission Record Schemas ──────────────────────────────────────────────────
export const CreateEmissionSchema = z.object({
  body: z.object({
    scope: z.nativeEnum(EmissionScope, {
      errorMap: () => ({ message: `scope must be SCOPE_1, SCOPE_2, or SCOPE_3` }),
    }),
    category: z.nativeEnum(EmissionCategory, {
      errorMap: () => ({
        message: `category must be one of: ${Object.values(EmissionCategory).join(', ')}`,
      }),
    }),
    description: z.string().max(500).optional(),
    amount: z.number().positive({ message: 'amount must be a positive number' }),
    unit: z.string().min(1).max(20).trim(),
    emissionFactor: z
      .number()
      .positive({ message: 'emissionFactor must be positive (kgCO2e per unit)' }),
    dateLogged: isoDate.optional(),
    evidenceUrl: url,
  }),
});

export const UpdateEmissionSchema = z.object({
  params: z.object({ id: cuid }),
  body: z.object({
    scope: z.nativeEnum(EmissionScope).optional(),
    category: z.nativeEnum(EmissionCategory).optional(),
    description: z.string().max(500).optional(),
    amount: z.number().positive().optional(),
    unit: z.string().min(1).max(20).trim().optional(),
    emissionFactor: z.number().positive().optional(),
    dateLogged: isoDate.optional(),
    evidenceUrl: url,
  }),
});

export const EmissionQuerySchema = z.object({
  query: z.object({
    scope: z.nativeEnum(EmissionScope).optional(),
    category: z.nativeEnum(EmissionCategory).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const EmissionIdParamSchema = z.object({
  params: z.object({ id: cuid }),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof RegisterSchema>['body'];
export type LoginInput = z.infer<typeof LoginSchema>['body'];
export type CreateEmissionInput = z.infer<typeof CreateEmissionSchema>['body'];
export type UpdateEmissionInput = z.infer<typeof UpdateEmissionSchema>['body'];
export type EmissionQueryInput = z.infer<typeof EmissionQuerySchema>['query'];
