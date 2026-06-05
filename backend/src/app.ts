// =============================================================================
// EXPRESS APPLICATION FACTORY
// =============================================================================

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { config } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import logger from './utils/logger';

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes         from './routes/auth.routes';
import userRoutes         from './routes/user.routes';
import companyRoutes      from './routes/company.routes';
import subscriptionRoutes from './routes/subscription.routes';
import emissionRoutes     from './routes/emission.routes';
import analyticsRoutes    from './routes/analytics.routes';
import billingRoutes      from './routes/billing.routes';
import adminRoutes        from './routes/admin.routes';
import teamRoutes         from './routes/team.routes';
import exportRoutes       from './routes/export.routes';
import mlRoutes           from './routes/ml.routes';

// ─── Billing webhook handler (needs raw body — imported directly) ──────────
import { handleStripeWebhook } from './controllers/billing.controller';

export function createApp(): Application {
  const app = express();

  // Trust the reverse proxy (Render) to correctly set X-Forwarded-For headers
  // This fixes the ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error in express-rate-limit
  app.set('trust proxy', 1);

  // Ensure FRONTEND_URL is available
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", frontendUrl],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  app.use(
    cors({
      origin: frontendUrl, // Strictly configured to only allow requests from FRONTEND_URL
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STRIPE WEBHOOK — Must be mounted BEFORE express.json()
  //
  // Why: Stripe verifies its signature against the raw request body Buffer.
  // express.json() consumes and parses the stream, destroying the raw buffer.
  // By using express.raw() on this specific route before the global JSON parser,
  // req.body will be a Buffer when it reaches handleStripeWebhook.
  // ══════════════════════════════════════════════════════════════════════════
  app.post(
    `${config.server.apiPrefix}/billing/webhook`,
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );

  // ─── Standard body parsers (after the webhook route) ────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    morgan(config.server.isProduction ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
  app.use(config.server.apiPrefix, apiRateLimiter);

  // ── Health check ──────────────────────────────────────────────────────────
  app.get(`${config.server.apiPrefix}/health`, (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
    });
  });

  // ── JSON API Routes ───────────────────────────────────────────────────────
  app.use(`${config.server.apiPrefix}/auth`,          authRoutes);
  app.use(`${config.server.apiPrefix}/users`,         userRoutes);
  app.use(`${config.server.apiPrefix}/companies`,     companyRoutes);
  app.use(`${config.server.apiPrefix}/subscriptions`, subscriptionRoutes);
  app.use(`${config.server.apiPrefix}/emissions`,     emissionRoutes);
  app.use(`${config.server.apiPrefix}/analytics`,     analyticsRoutes);
  app.use(`${config.server.apiPrefix}/billing`,       billingRoutes);
  app.use(`${config.server.apiPrefix}/admin`,         adminRoutes);
  app.use(`${config.server.apiPrefix}/team`,          teamRoutes);
  app.use(`${config.server.apiPrefix}/export`,        exportRoutes);
  app.use(`${config.server.apiPrefix}/ml`,            mlRoutes);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
