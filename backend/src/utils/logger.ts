// =============================================================================
// LOGGER — Winston
// Structured JSON logging in production, coloured console output in dev.
// =============================================================================

import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// ─── Development format ───────────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack
      ? `[${ts}] ${level}: ${message}\n${stack}`
      : `[${ts}] ${level}: ${message}`
  )
);

// ─── Production format (structured JSON) ─────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: config.server.isProduction ? 'warn' : 'debug',
  format: config.server.isProduction ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(config.server.isProduction
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
  ],
});

export default logger;
