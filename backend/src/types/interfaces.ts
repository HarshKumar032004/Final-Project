// =============================================================================
// SHARED TYPESCRIPT INTERFACES & DTOs
// =============================================================================

import { UserRole } from './enums';

// ─── Domain Types (matching Prisma schema) ────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  industry: string;
  registrationNumber: string;
  totalEmployees: number;
  logoUrl: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  refreshToken: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  companyId: string;
  planType: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  trialEndDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmissionRecord {
  id: string;
  companyId: string;
  loggedById: string;
  scope: string;
  category: string;
  description: string | null;
  amount: number;
  unit: string;
  emissionFactor: number;
  calculatedCO2e: number;
  dateLogged: Date;
  evidenceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Safe User (never expose password or refreshToken) ───────────────────────
export type SafeUser = Omit<User, 'password' | 'refreshToken'>;

// ─── Company DTOs ─────────────────────────────────────────────────────────────
export interface CreateCompanyDTO {
  name: string;
  industry: string;
  registrationNumber: string;
  totalEmployees: number;
  logoUrl?: string;
  website?: string;
}

export interface UpdateCompanyDTO {
  name?: string;
  industry?: string;
  totalEmployees?: number;
  logoUrl?: string;
  website?: string;
}

// ─── User DTOs ────────────────────────────────────────────────────────────────
export interface RegisterDTO {
  // Company
  companyName: string;
  industry: string;
  registrationNumber: string;
  totalEmployees: number;
  // User
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateUserRoleDTO {
  role: UserRole;
}

// ─── Subscription DTOs ────────────────────────────────────────────────────────
export interface CreateSubscriptionDTO {
  companyId: string;
  planType?: string;
  startDate?: Date;
  endDate?: Date;
  trialEndDate?: Date;
  stripeCustomerId?: string;
  razorpayCustomerId?: string;
}

export interface UpdateSubscriptionDTO {
  planType?: string;
  status?: string;
  endDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
}

// ─── Emission Record DTOs ─────────────────────────────────────────────────────
export interface CreateEmissionDTO {
  scope: string;
  category: string;
  description?: string;
  amount: number;
  unit: string;
  emissionFactor: number;
  dateLogged?: Date;
  evidenceUrl?: string;
}

export interface UpdateEmissionDTO {
  scope?: string;
  category?: string;
  description?: string;
  amount?: number;
  unit?: string;
  emissionFactor?: number;
  dateLogged?: Date;
  evidenceUrl?: string;
}

// ─── Emission Query Filters ───────────────────────────────────────────────────
export interface EmissionQueryFilters {
  scope?: string;
  category?: string;
  from?: string;   // ISO date string
  to?: string;     // ISO date string
  page?: string;
  limit?: string;
}

// ─── JWT ──────────────────────────────────────────────────────────────────────
export interface JwtAccessPayload {
  sub: string;       // User ID (cuid)
  email: string;
  role: UserRole;
  companyId: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── API Response Shapes ─────────────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

// ─── Paginated Response ───────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
