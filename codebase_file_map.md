# CarbonTrack - Comprehensive Codebase Map

This document provides an exhaustive map of every file across the Backend, Frontend, and ML Service.

## Backend (Node.js/Express)

### 1. File Path: `backend/prisma/schema.prisma`
**2. Connects To:** No direct internal/external imports detected.

**3. Core Purpose:** Single source of truth for the PostgreSQL database structure, defining all models and relationships.

---

### 1. File Path: `backend/src/app.ts`
**2. Connects To:** ./config/env, ./controllers/billing.controller, ./middleware/errorHandler.middleware, ./middleware/rateLimiter.middleware, ./routes/admin.routes, ./routes/analytics.routes, ./routes/auth.routes, ./routes/billing.routes, ./routes/company.routes, ./routes/emission.routes, ./routes/export.routes, ./routes/ml.routes, ./routes/settings.routes, ./routes/subscription.routes, ./routes/team.routes, ./routes/user.routes, ./utils/logger, cookie-parser, cors, express, helmet, morgan

**3. Core Purpose:** Core architectural configuration or utility file (app.ts) necessary for system operation.

---

### 1. File Path: `backend/src/config/database.ts`
**2. Connects To:** ../utils/logger, ./env, @prisma/client

**3. Core Purpose:** Core architectural configuration or utility file (database.ts) necessary for system operation.

---

### 1. File Path: `backend/src/config/env.ts`
**2. Connects To:** dotenv, path

**3. Core Purpose:** Core architectural configuration or utility file (env.ts) necessary for system operation.

---

### 1. File Path: `backend/src/controllers/admin.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../types/enums, ../utils/response.utils, express

**3. Core Purpose:** Controller logic for admin. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/analytics.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../services/ml.service, ../types/enums, ../utils/response.utils, express

**3. Core Purpose:** Controller logic for analytics. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/auth.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../services/email.service, ../types/enums, ../types/interfaces, ../types/schemas, ../utils/jwt.utils, ../utils/logger, ../utils/response.utils, bcryptjs, crypto, express

**3. Core Purpose:** Controller logic for auth. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/billing.controller.ts`
**2. Connects To:** ../config/database, ../config/env, ../middleware/errorHandler.middleware, ../services/audit.service, ../types/enums, ../utils/logger, ../utils/response.utils, express, stripe, zod

**3. Core Purpose:** Controller logic for billing. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/company.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../services/audit.service, ../types/enums, ../types/interfaces, ../utils/response.utils, express

**3. Core Purpose:** Controller logic for company. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/emission.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../services/audit.service, ../types/enums, ../types/schemas, ../utils/logger, ../utils/response.utils, express

**3. Core Purpose:** Controller logic for emission. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/export.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../types/enums, express, pdfkit

**3. Core Purpose:** Controller logic for export. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/ml.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../services/ml.service, ../utils/response.utils, express

**3. Core Purpose:** Controller logic for ml. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/settings.controller.ts`
**2. Connects To:** ../config/database, crypto, express, zod

**3. Core Purpose:** Controller logic for settings. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/subscription.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../types/enums, ../types/interfaces, ../utils/response.utils, express

**3. Core Purpose:** Controller logic for subscription. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/team.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../services/audit.service, ../services/email.service, ../types/enums, ../utils/logger, ../utils/response.utils, bcryptjs, crypto, express

**3. Core Purpose:** Controller logic for team. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/controllers/user.controller.ts`
**2. Connects To:** ../config/database, ../middleware/errorHandler.middleware, ../services/audit.service, ../services/email.service, ../types/enums, ../types/interfaces, ../utils/logger, ../utils/response.utils, crypto, express

**3. Core Purpose:** Controller logic for user. Bridges Express API routes to database operations.

---

### 1. File Path: `backend/src/middleware/authenticate.middleware.ts`
**2. Connects To:** ../types/enums, ../types/interfaces, ../utils/jwt.utils, ../utils/logger, express

**3. Core Purpose:** Express middleware responsible for intercepting requests for authenticate (e.g., security, validation).

---

### 1. File Path: `backend/src/middleware/authorize.middleware.ts`
**2. Connects To:** ../types/enums, ../utils/logger, express

**3. Core Purpose:** Express middleware responsible for intercepting requests for authorize (e.g., security, validation).

---

### 1. File Path: `backend/src/middleware/errorHandler.middleware.ts`
**2. Connects To:** ../config/env, ../types/enums, ../utils/logger, express

**3. Core Purpose:** Express middleware responsible for intercepting requests for errorHandler (e.g., security, validation).

---

### 1. File Path: `backend/src/middleware/plan.middleware.ts`
**2. Connects To:** ../config/database, ../services/audit.service, ../types/enums, ../utils/logger, express

**3. Core Purpose:** Express middleware responsible for intercepting requests for plan (e.g., security, validation).

---

### 1. File Path: `backend/src/middleware/rateLimiter.middleware.ts`
**2. Connects To:** ../types/enums, express-rate-limit

**3. Core Purpose:** Express middleware responsible for intercepting requests for rateLimiter (e.g., security, validation).

---

### 1. File Path: `backend/src/middleware/validate.middleware.ts`
**2. Connects To:** ../types/enums, express, zod

**3. Core Purpose:** Express middleware responsible for intercepting requests for validate (e.g., security, validation).

---

### 1. File Path: `backend/src/routes/admin.routes.ts`
**2. Connects To:** ../controllers/admin.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, express

**3. Core Purpose:** Defines Express API endpoints for admin and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/analytics.routes.ts`
**2. Connects To:** ../controllers/analytics.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, express

**3. Core Purpose:** Defines Express API endpoints for analytics and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/auth.routes.ts`
**2. Connects To:** ../controllers/auth.controller, ../middleware/authenticate.middleware, ../middleware/rateLimiter.middleware, ../middleware/validate.middleware, ../types/schemas, express

**3. Core Purpose:** Defines Express API endpoints for auth and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/billing.routes.ts`
**2. Connects To:** ../controllers/billing.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, ../types/enums, express

**3. Core Purpose:** Defines Express API endpoints for billing and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/company.routes.ts`
**2. Connects To:** ../controllers/company.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, express

**3. Core Purpose:** Defines Express API endpoints for company and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/emission.routes.ts`
**2. Connects To:** ../controllers/emission.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, ../middleware/validate.middleware, ../types/schemas, express

**3. Core Purpose:** Defines Express API endpoints for emission and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/export.routes.ts`
**2. Connects To:** ../controllers/export.controller, ../middleware/authenticate.middleware, ../middleware/plan.middleware, ../types/enums, express

**3. Core Purpose:** Defines Express API endpoints for export and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/ml.routes.ts`
**2. Connects To:** ../controllers/ml.controller, ../middleware/authenticate.middleware, ../middleware/plan.middleware, ../types/enums, express

**3. Core Purpose:** Defines Express API endpoints for ml and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/settings.routes.ts`
**2. Connects To:** ../controllers/settings.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, ../middleware/plan.middleware, ../types/enums, express

**3. Core Purpose:** Defines Express API endpoints for settings and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/subscription.routes.ts`
**2. Connects To:** ../controllers/subscription.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, express

**3. Core Purpose:** Defines Express API endpoints for subscription and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/team.routes.ts`
**2. Connects To:** ../controllers/team.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, ../middleware/rateLimiter.middleware, ../middleware/validate.middleware, ../types/schemas, express

**3. Core Purpose:** Defines Express API endpoints for team and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/routes/user.routes.ts`
**2. Connects To:** ../controllers/user.controller, ../middleware/authenticate.middleware, ../middleware/authorize.middleware, ../middleware/validate.middleware, ../types/schemas, express

**3. Core Purpose:** Defines Express API endpoints for user and attaches necessary middleware/guards.

---

### 1. File Path: `backend/src/server.ts`
**2. Connects To:** ./app, ./config/database, ./config/env, ./utils/logger

**3. Core Purpose:** Core architectural configuration or utility file (server.ts) necessary for system operation.

---

### 1. File Path: `backend/src/services/audit.service.ts`
**2. Connects To:** ../config/database, ../utils/logger, express

**3. Core Purpose:** Core architectural configuration or utility file (audit.service.ts) necessary for system operation.

---

### 1. File Path: `backend/src/services/email.service.ts`
**2. Connects To:** ../utils/logger, resend

**3. Core Purpose:** Core architectural configuration or utility file (email.service.ts) necessary for system operation.

---

### 1. File Path: `backend/src/services/ml.service.ts`
**2. Connects To:** ../config/env, ../utils/logger

**3. Core Purpose:** Core architectural configuration or utility file (ml.service.ts) necessary for system operation.

---

### 1. File Path: `backend/src/types/enums.ts`
**2. Connects To:** No direct internal/external imports detected.

**3. Core Purpose:** Core architectural configuration or utility file (enums.ts) necessary for system operation.

---

### 1. File Path: `backend/src/types/interfaces.ts`
**2. Connects To:** ./enums

**3. Core Purpose:** Core architectural configuration or utility file (interfaces.ts) necessary for system operation.

---

### 1. File Path: `backend/src/types/schemas.ts`
**2. Connects To:** ./enums, zod

**3. Core Purpose:** Core architectural configuration or utility file (schemas.ts) necessary for system operation.

---

### 1. File Path: `backend/src/utils/jwt.utils.ts`
**2. Connects To:** ../config/env, ../types/enums, ../types/interfaces, jsonwebtoken

**3. Core Purpose:** Core architectural configuration or utility file (jwt.utils.ts) necessary for system operation.

---

### 1. File Path: `backend/src/utils/logger.ts`
**2. Connects To:** ../config/env, winston

**3. Core Purpose:** Core architectural configuration or utility file (logger.ts) necessary for system operation.

---

### 1. File Path: `backend/src/utils/response.utils.ts`
**2. Connects To:** ../types/enums, ../types/interfaces, express

**3. Core Purpose:** Core architectural configuration or utility file (response.utils.ts) necessary for system operation.

---

## Frontend (Next.js)

### 1. File Path: `frontend/src/app/(auth)/accept-invite/page.tsx`
**2. Connects To:** @/context/AuthContext, @/services/apiClient, @hookform/resolvers/zod, axios, lucide-react, next/link, next/navigation, react, react-hook-form, zod

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(auth)/forgot-password/page.tsx`
**2. Connects To:** @/services/apiClient, @hookform/resolvers/zod, axios, lucide-react, next/link, react, react-hook-form, zod

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(auth)/login/page.tsx`
**2. Connects To:** @/context/AuthContext, @/services/apiClient, @hookform/resolvers/zod, axios, lucide-react, next/link, next/navigation, react, react-hook-form, zod

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(auth)/register/page.tsx`
**2. Connects To:** @/context/AuthContext, @/services/apiClient, @hookform/resolvers/zod, axios, lucide-react, next/link, next/navigation, react, react-hook-form, zod

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(auth)/reset-password/page.tsx`
**2. Connects To:** @/services/apiClient, @hookform/resolvers/zod, axios, lucide-react, next/link, next/navigation, react, react-hook-form, zod

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/billing/page.tsx`
**2. Connects To:** @/services/apiClient, framer-motion, lucide-react, next/navigation, react, react-hot-toast

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/dashboard/page.tsx`
**2. Connects To:** @/components/dashboard/AnalyticsDashboard, next

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/layout.tsx`
**2. Connects To:** @/components/layout/ProtectedRoute, @/context/AuthContext, framer-motion, lucide-react, next/link, next/navigation, react

**3. Core Purpose:** Next.js App Router component for rendering the layout.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/logs/audit/page.tsx`
**2. Connects To:** @/services/apiClient, date-fns, lucide-react, react

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/logs/page.tsx`
**2. Connects To:** @/services/apiClient, axios, lucide-react, react, react-hot-toast

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/settings/page.tsx`
**2. Connects To:** @/services/apiClient, @hookform/resolvers/zod, framer-motion, lucide-react, react, react-hook-form, react-hot-toast, zod

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/subscription/page.tsx`
**2. Connects To:** @/services/apiClient, framer-motion, lucide-react, react, react-hot-toast

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/(protected)/team/page.tsx`
**2. Connects To:** @/components/team/InviteMemberModal, @/context/AuthContext, @/services/apiClient, lucide-react, react

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/admin/dashboard/page.tsx`
**2. Connects To:** @/services/apiClient, lucide-react, react

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/app/layout.tsx`
**2. Connects To:** @/context/AuthContext, next, next/font/google

**3. Core Purpose:** Next.js App Router component for rendering the layout.tsx view.

---

### 1. File Path: `frontend/src/app/page.tsx`
**2. Connects To:** framer-motion, lucide-react, next/link, react

**3. Core Purpose:** Next.js App Router component for rendering the page.tsx view.

---

### 1. File Path: `frontend/src/components/charts/EmissionsLineChart.tsx`
**2. Connects To:** @/types/analytics, react, recharts

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for EmissionsLineChart.

---

### 1. File Path: `frontend/src/components/charts/ScopeDonutChart.tsx`
**2. Connects To:** @/types/analytics, react, recharts

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for ScopeDonutChart.

---

### 1. File Path: `frontend/src/components/dashboard/AnalyticsDashboard.tsx`
**2. Connects To:** @/components/charts/EmissionsLineChart, @/components/charts/ScopeDonutChart, @/components/dashboard/KpiCardsRow, @/components/dashboard/RecentRecordsTable, @/hooks/useDashboardData, jspdf, jspdf-autotable, lucide-react, react

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for AnalyticsDashboard.

---

### 1. File Path: `frontend/src/components/dashboard/KpiCardsRow.tsx`
**2. Connects To:** lucide-react, react

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for KpiCardsRow.

---

### 1. File Path: `frontend/src/components/dashboard/Navbar.tsx`
**2. Connects To:** lucide-react, react

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for Navbar.

---

### 1. File Path: `frontend/src/components/dashboard/RecentRecordsTable.tsx`
**2. Connects To:** @/types/analytics, react

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for RecentRecordsTable.

---

### 1. File Path: `frontend/src/components/layout/ProtectedRoute.tsx`
**2. Connects To:** @/context/AuthContext, lucide-react, next/navigation, react

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for ProtectedRoute.

---

### 1. File Path: `frontend/src/components/team/InviteMemberModal.tsx`
**2. Connects To:** @/context/AuthContext, @/services/apiClient, lucide-react, react, react-hot-toast

**3. Core Purpose:** Reusable React UI component encapsulating markup and local state for InviteMemberModal.

---

### 1. File Path: `frontend/src/context/AuthContext.tsx`
**2. Connects To:** next/navigation, react

**3. Core Purpose:** React Context provider for managing global state (like Auth) across the frontend application.

---

### 1. File Path: `frontend/src/hooks/useDashboardData.ts`
**2. Connects To:** @/services/apiClient, @/types/analytics, axios, react

**3. Core Purpose:** Custom React hook (useDashboardData) for abstracting state management and API fetching logic.

---

### 1. File Path: `frontend/src/services/apiClient.ts`
**2. Connects To:** axios

**3. Core Purpose:** Frontend API client configuration and utility functions for apiClient.

---

### 1. File Path: `frontend/src/types/analytics.ts`
**2. Connects To:** No direct internal/external imports detected.

**3. Core Purpose:** Core architectural configuration or utility file (analytics.ts) necessary for system operation.

---

## ML Service (Python)

### 1. File Path: `ml-service/main.py`
**2. Connects To:** datetime, dateutil.relativedelta, fastapi, numpy, pandas, pydantic, sklearn.linear_model, typing

**3. Core Purpose:** FastAPI entry point and core algorithmic engine for processing predictive ML requests.

---

