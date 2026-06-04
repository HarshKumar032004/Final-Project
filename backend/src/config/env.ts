// =============================================================================
// ENVIRONMENT CONFIGURATION
// Validates and exports all required environment variables with strict types.
// The app will refuse to start if required variables are missing.
// =============================================================================

import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Helper — enforce required vars ───────────────────────────────────────────
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue = ''): string {
  return process.env[key] ?? defaultValue;
}

// ─── Exported Config Object ───────────────────────────────────────────────────
export const config = {
  server: {
    nodeEnv: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    port: parseInt(optionalEnv('PORT', '5000'), 10),
    apiPrefix: optionalEnv('API_PREFIX', '/api/v1'),
    isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
  },

  db: {
    postgresUrl: requireEnv('DATABASE_URL'),
  },

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  stripe: {
    secretKey: optionalEnv('STRIPE_SECRET_KEY'),
    webhookSecret: optionalEnv('STRIPE_WEBHOOK_SECRET'),
  },

  razorpay: {
    keyId: optionalEnv('RAZORPAY_KEY_ID'),
    keySecret: optionalEnv('RAZORPAY_KEY_SECRET'),
  },

  cors: {
    allowedOrigins: optionalEnv('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
  },

  microservices: {
    pythonUrl: optionalEnv('PYTHON_SERVICE_URL', 'http://127.0.0.1:8000'),
  },
} as const;

export type AppConfig = typeof config;
