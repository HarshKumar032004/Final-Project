# 🌍 CarbonTrack — AI-Driven Carbon Footprint Tracker

> **BCA Final Year Project** | Full-Stack B2B SaaS Platform for Enterprise Carbon Analytics

CarbonTrack is a production-grade, multi-tenant SaaS platform that enables businesses to track, analyze, and forecast their carbon emissions (CO₂e) using a machine-learning prediction engine. Built with a modern microservices architecture.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Option A — Run with Hosted Services (Recommended for Demos)](#-option-a--run-with-hosted-services-recommended-for-demos)
- [Option B — Run Fully From Scratch (Local Everything)](#-option-b--run-fully-from-scratch-local-everything)
- [Option C — Run with Docker Compose (One Command)](#-option-c--run-with-docker-compose-one-command)
- [Environment Variable Reference](#-environment-variable-reference)
- [Available Scripts](#-available-scripts)
- [Key Features](#-key-features)
- [API Overview](#-api-overview)

---

## 🎯 Project Overview

CarbonTrack helps companies:
- Log their Scope 1, 2 & 3 carbon emission records
- Visualize emissions via interactive dashboards and charts
- Get AI/ML-powered predictions for future emission trends
- Manage teams, subscriptions, and billing
- Export reports as PDF or CSV
- Receive email notifications and audit logs

---

## 🛠 Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | Next.js 16, React 19, TypeScript, Tailwind CSS  |
| Backend      | Node.js, Express.js, TypeScript, Prisma ORM     |
| Database     | PostgreSQL (Neon.tech hosted / local Docker)    |
| ML Service   | Python 3.11, FastAPI, Scikit-Learn, Pandas      |
| Auth         | JWT (Access + Refresh tokens), bcryptjs         |
| Email        | Resend API                                      |
| Payments     | Stripe (test mode)                              |
| Container    | Docker + Docker Compose                         |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser / Client                    │
│              Next.js Frontend  (port 3000)               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST API)
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Express.js Backend API  (port 5000)            │
│   Auth · Emissions · Analytics · Billing · Teams        │
└──────────────┬──────────────────────┬───────────────────┘
               │ Prisma ORM           │ HTTP (internal)
               ▼                      ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│   PostgreSQL DB     │   │  FastAPI ML Service (port 8000)│
│  (Neon.tech / local)│   │  Linear Regression Forecasting│
└─────────────────────┘   └──────────────────────────────┘
```

---

## 📁 Project Structure

```
Final Project/
├── README.md                   ← You are here
├── docker-compose.yml          ← One-command Docker setup
│
├── backend/                    ← Node.js / Express API
│   ├── src/
│   │   ├── app.ts              ← Express app setup
│   │   ├── server.ts           ← Entry point
│   │   ├── config/             ← env.ts, database.ts
│   │   ├── controllers/        ← Route handlers
│   │   ├── middleware/         ← Auth, rate-limit, validation
│   │   ├── routes/             ← API route definitions
│   │   ├── services/           ← Email, ML, Audit services
│   │   ├── types/              ← TypeScript interfaces & schemas
│   │   └── utils/              ← JWT, logger, response helpers
│   ├── prisma/
│   │   └── schema.prisma       ← Database schema (PostgreSQL)
│   ├── .env                    ← Your actual secrets (never commit)
│   ├── .env.example            ← Template — copy this to .env
│   └── package.json
│
├── frontend/                   ← Next.js 16 App Router
│   ├── src/
│   │   ├── app/                ← Pages (auth, dashboard, billing…)
│   │   ├── components/         ← Reusable UI components
│   │   ├── context/            ← Auth context (global state)
│   │   ├── hooks/              ← Custom React hooks
│   │   ├── services/           ← Axios API client
│   │   └── types/              ← TypeScript types
│   ├── .env.local              ← Your actual secrets (never commit)
│   ├── .env.example            ← Template — copy this to .env.local
│   └── package.json
│
└── ml-service/                 ← Python FastAPI Prediction Engine
    ├── main.py                 ← FastAPI app + ML algorithm
    ├── requirements.txt        ← Python dependencies
    ├── .env.example            ← Template (optional for ML service)
    └── Dockerfile
```

---

## ✅ Prerequisites

Make sure the following are installed on the machine before starting:

| Tool         | Version       | Check Command         | Download                              |
|--------------|---------------|-----------------------|---------------------------------------|
| Node.js      | 18.x or 20.x  | `node -v`             | https://nodejs.org                    |
| npm          | 9.x or later  | `npm -v`              | Comes with Node.js                    |
| Python       | 3.10 or 3.11  | `python3 --version`   | https://python.org                    |
| pip          | latest        | `pip --version`       | Comes with Python                     |
| Git          | any           | `git --version`       | https://git-scm.com                   |
| Docker       | 24.x+         | `docker -v`           | https://docker.com *(only for Option C)* |

---

## 🚀 Option A — Run with Hosted Services (Recommended for Demos)

This is the **easiest and fastest option**. It uses the already-configured hosted database (Neon.tech) and hosted APIs. You only need to install Node.js and Python.

### Step 1 — Clone / Copy the Project

```bash
# If running from a CD/USB, just open a terminal in the project folder
cd "Final Project"
```

### Step 2 — Setup the Backend

```bash
cd backend

# Install all Node.js dependencies
npm install

# Copy the environment variables template
cp .env.example .env
# ✅ The .env file already has working hosted values filled in
# No changes needed — it connects to the live Neon.tech database

# Generate Prisma client (required before first run)
npm run db:generate

# Start the backend server
npm run dev
```

> ✅ Backend will be running at: **http://localhost:5000**

---

### Step 3 — Setup the Frontend

Open a **new terminal tab/window**:

```bash
cd "Final Project/frontend"

# Install all Node.js dependencies
npm install

# Copy the environment variables template
cp .env.example .env.local
# ✅ Points to http://localhost:5000 — no changes needed

# Start the frontend dev server
npm run dev
```

> ✅ Frontend will be running at: **http://localhost:3000**

---

### Step 4 — Setup the ML Service

Open another **new terminal tab/window**:

```bash
cd "Final Project/ml-service"

# Create a Python virtual environment
python3 -m venv venv

# Activate the virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the ML service
uvicorn main:app --reload --port 8000
```

> ✅ ML Service will be running at: **http://localhost:8000**

---

### Step 5 — Open the App

Open your browser and go to: **http://localhost:3000**

- Register a new account to get started
- Explore the Dashboard, Emissions Log, Analytics, and Team sections

---

## 🔧 Option B — Run Fully From Scratch (Local Everything)

Use this if you want **zero external dependencies** (no Neon.tech, no hosted DB).

### Step 1 — Install and Start PostgreSQL Locally

Option 1 — via Docker (easiest):
```bash
docker run --name carbontrack-db \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=rootpassword \
  -e POSTGRES_DB=carbontrack \
  -p 5432:5432 \
  -d postgres:15-alpine
```

Option 2 — Install PostgreSQL natively and create a database named `carbontrack`.

### Step 2 — Configure Backend for Local DB

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and change the `DATABASE_URL` to your local DB:
```
DATABASE_URL=postgresql://root:rootpassword@localhost:5432/carbontrack?schema=public
```

Also generate fresh JWT secrets:
```bash
# Run this and paste output into .env for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 3 — Run Database Migrations

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate   # creates all tables in your local DB
```

### Step 4 — Start All Three Services

Follow the same **Steps 2, 3, 4 from Option A** above using your local `.env`.

---

## 🐳 Option C — Run with Docker Compose (One Command)

This runs all services (Frontend + Backend + ML + PostgreSQL) in containers.

### Prerequisites

- Docker Desktop must be installed and running

### Steps

```bash
# From the root of the project
cd "Final Project"

# Build and start all containers
docker compose up --build

# To stop all containers
docker compose down
```

### Service Ports (Docker)

| Service    | URL                         |
|------------|-----------------------------|
| Frontend   | http://localhost:3000        |
| Backend    | http://localhost:8080        |
| ML Service | http://localhost:8000        |
| PostgreSQL | localhost:5432               |

> ⚠️ **Note:** For Docker mode, the `NEXT_PUBLIC_API_URL` in the frontend points to port `8080` (not `5000`). This is automatically set in `docker-compose.yml`.

---

## 📦 Environment Variable Reference

### Backend (`backend/.env`)

| Variable                  | Required | Description                                      | Default / Example                        |
|---------------------------|----------|--------------------------------------------------|------------------------------------------|
| `NODE_ENV`                | No       | App environment                                  | `development`                            |
| `PORT`                    | No       | Backend server port                              | `5000`                                   |
| `API_PREFIX`              | No       | API route prefix                                 | `/api/v1`                                |
| `FRONTEND_URL`            | No       | Frontend origin (used in emails)                 | `http://localhost:3000`                  |
| `DATABASE_URL`            | **Yes**  | PostgreSQL connection string                     | Neon.tech URL or local                   |
| `JWT_ACCESS_SECRET`       | **Yes**  | Secret for signing access tokens                 | 32-byte base64 string                    |
| `JWT_REFRESH_SECRET`      | **Yes**  | Secret for signing refresh tokens                | 32-byte base64 string                    |
| `JWT_ACCESS_EXPIRES_IN`   | No       | Access token TTL                                 | `15m`                                    |
| `JWT_REFRESH_EXPIRES_IN`  | No       | Refresh token TTL                                | `7d`                                     |
| `RESEND_API_KEY`          | No       | Resend.com API key for emails                    | Get from https://resend.com              |
| `EMAIL_FROM`              | No       | Sender name and email                            | `CarbonTrack <onboarding@resend.dev>`    |
| `STRIPE_SECRET_KEY`       | No       | Stripe secret key (test mode)                    | `sk_test_...`                            |
| `STRIPE_WEBHOOK_SECRET`   | No       | Stripe webhook signing secret                    | `whsec_...`                              |
| `STRIPE_PRICE_STARTER`    | No       | Stripe Price ID for Starter plan                 | `price_...`                              |
| `STRIPE_PRICE_PRO`        | No       | Stripe Price ID for Pro plan                     | `price_...`                              |
| `STRIPE_PRICE_ENTERPRISE` | No       | Stripe Price ID for Enterprise plan              | `price_...`                              |
| `RAZORPAY_KEY_ID`         | No       | Razorpay key (Indian payments, optional)         | `rzp_test_...`                           |
| `RAZORPAY_KEY_SECRET`     | No       | Razorpay secret (optional)                       | —                                        |
| `ALLOWED_ORIGINS`         | No       | Comma-separated CORS origins                     | `http://localhost:3000`                  |
| `PYTHON_SERVICE_URL`      | No       | ML service URL                                   | `http://127.0.0.1:8000`                  |

### Frontend (`frontend/.env.local`)

| Variable                          | Required | Description                          | Example                              |
|-----------------------------------|----------|--------------------------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL`             | **Yes**  | Full backend API base URL            | `http://localhost:5000/api/v1`       |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No    | Stripe publishable key (test mode)   | `pk_test_...`                        |

### ML Service (`ml-service/.env`)

| Variable      | Required | Description                              | Default       |
|---------------|----------|------------------------------------------|---------------|
| `ENVIRONMENT` | No       | Service environment label                | `development` |
| `PORT`        | No       | Port to run the FastAPI service on       | `8000`        |
| `HOST`        | No       | Host to bind the FastAPI service to      | `0.0.0.0`     |

---

## 📜 Available Scripts

### Backend

```bash
npm run dev           # Start dev server with hot-reload
npm run build         # Compile TypeScript to dist/
npm start             # Run compiled production build
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run DB migrations (creates/updates tables)
npm run db:push       # Push schema changes without migration history
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run db:seed       # Seed the database with sample data
npm test              # Run Jest test suite
```

### Frontend

```bash
npm run dev     # Start Next.js dev server
npm run build   # Build production bundle
npm start       # Serve production build
npm run lint    # Run ESLint
```

### ML Service

```bash
# Start with auto-reload (development)
uvicorn main:app --reload --port 8000

# Start without reload (production/demo)
uvicorn main:app --port 8000

# View auto-generated API docs
# Open browser → http://localhost:8000/docs
```

---

## ✨ Key Features

| Feature                  | Description                                                       |
|--------------------------|-------------------------------------------------------------------|
| 🔐 Auth System           | Register, Login, Forgot Password, Email Verification with JWT     |
| 📊 Analytics Dashboard   | KPI cards, Emissions Line Chart, Scope Donut Chart, recent records|
| 📝 Emission Logging      | Log Scope 1/2/3 emissions with category, source, and quantity     |
| 🤖 AI Forecasting        | ML-powered future emission predictions using Linear Regression    |
| 👥 Team Management       | Invite members, assign roles (Admin/Manager/Viewer)               |
| 💳 Subscription & Billing| Stripe-powered Starter / Pro / Enterprise plans                   |
| 📄 Export Reports        | Download emission data as PDF or CSV                              |
| 📧 Email Notifications   | Password reset, team invitations via Resend                       |
| 🛡 Audit Logs            | Full audit trail of all actions across the platform               |
| 👑 Admin Dashboard       | Super-admin panel for platform-wide management                    |

---

## 🔗 API Overview

All backend routes are prefixed with `/api/v1`.

| Route Group     | Base Path                | Description                   |
|-----------------|--------------------------|-------------------------------|
| Auth            | `/api/v1/auth`           | Login, register, tokens       |
| Emissions       | `/api/v1/emissions`      | CRUD for emission records     |
| Analytics       | `/api/v1/analytics`      | Dashboard stats & charts data |
| ML Predictions  | `/api/v1/ml`             | AI forecast endpoints         |
| Team            | `/api/v1/team`           | Team invite & management      |
| Billing         | `/api/v1/billing`        | Stripe webhooks & checkout    |
| Subscription    | `/api/v1/subscription`   | Plan info & upgrades          |
| Export          | `/api/v1/export`         | PDF/CSV report generation     |
| Settings        | `/api/v1/settings`       | Company & user settings       |
| Admin           | `/api/v1/admin`          | Super-admin operations        |

### ML Service API

| Endpoint        | Method | Description                                |
|-----------------|--------|--------------------------------------------|
| `/api/predict`  | POST   | Predict future CO₂e given historical data  |
| `/docs`         | GET    | Auto-generated Swagger UI documentation   |
| `/redoc`        | GET    | ReDoc API documentation                    |

---

## 👨‍💻 Developer

**Harsh Kumar**
BCA Final Year Project — 2026

---

> **Note for professors:** The project uses a hosted PostgreSQL database (Neon.tech) and hosted API keys so it can be demonstrated without any local database setup. Simply follow **Option A** to get everything running in under 5 minutes.
