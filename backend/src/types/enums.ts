// =============================================================================
// SHARED ENUMS
// Mirror of Prisma-generated enums — use these in application code.
// Prisma generates its own enums in @prisma/client; these are for runtime use
// and as parameter types in controllers/middleware.
// =============================================================================

export enum UserRole {
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  DATA_CONTRIBUTOR = 'DATA_CONTRIBUTOR',
  AUDITOR = 'AUDITOR',
}

export enum PlanType {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  TRIALING = 'TRIALING',
}

export enum Industry {
  MANUFACTURING = 'MANUFACTURING',
  TECHNOLOGY = 'TECHNOLOGY',
  FINANCE = 'FINANCE',
  HEALTHCARE = 'HEALTHCARE',
  RETAIL = 'RETAIL',
  LOGISTICS = 'LOGISTICS',
  ENERGY = 'ENERGY',
  AGRICULTURE = 'AGRICULTURE',
  CONSTRUCTION = 'CONSTRUCTION',
  OTHER = 'OTHER',
}

export enum EmissionScope {
  SCOPE_1 = 'SCOPE_1',
  SCOPE_2 = 'SCOPE_2',
  SCOPE_3 = 'SCOPE_3',
}

export enum EmissionCategory {
  ELECTRICITY = 'ELECTRICITY',
  NATURAL_GAS = 'NATURAL_GAS',
  FLEET_VEHICLES = 'FLEET_VEHICLES',
  AIR_TRAVEL = 'AIR_TRAVEL',
  GROUND_TRAVEL = 'GROUND_TRAVEL',
  WASTE = 'WASTE',
  WATER = 'WATER',
  REFRIGERANTS = 'REFRIGERANTS',
  PURCHASED_GOODS = 'PURCHASED_GOODS',
  EMPLOYEE_COMMUTE = 'EMPLOYEE_COMMUTE',
  OTHER = 'OTHER',
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}
