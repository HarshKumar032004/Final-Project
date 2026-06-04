// =============================================================================
// SERVER ENTRY POINT — Prisma only, no MongoDB
// =============================================================================

import { createApp } from './app';
import prisma, { disconnectPrisma } from './config/database';
import { config } from './config/env';
import logger from './utils/logger';

async function bootstrap(): Promise<void> {
  try {
    // 1. Verify Prisma / PostgreSQL connection
    await prisma.$connect();
    logger.info('[Server] PostgreSQL connected via Prisma');

    // 2. Create and start Express app
    const app = createApp();

    const server = app.listen(config.server.port, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════╗
║   🌱  Carbon Footprint Tracker API                       ║
╠══════════════════════════════════════════════════════════╣
║   Environment : ${config.server.nodeEnv.padEnd(40)}║
║   Port        : ${String(config.server.port).padEnd(40)}║
║   API Prefix  : ${config.server.apiPrefix.padEnd(40)}║
║   Database    : ${'PostgreSQL (Prisma)'.padEnd(40)}║
╚══════════════════════════════════════════════════════════╝
      `);
    });

    // 3. Graceful shutdown — close HTTP then Prisma
    const gracefulShutdown = async (signal: string) => {
      logger.info(`[Server] ${signal} — shutting down...`);
      server.close(async () => {
        await disconnectPrisma();
        logger.info('[Server] Shutdown complete');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
    process.on('SIGINT',  () => { void gracefulShutdown('SIGINT'); });
    process.on('unhandledRejection', (reason) => {
      logger.error('[Server] Unhandled rejection:', reason);
      void gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('[Server] Failed to start:', error);
    await disconnectPrisma();
    process.exit(1);
  }
}

void bootstrap();
