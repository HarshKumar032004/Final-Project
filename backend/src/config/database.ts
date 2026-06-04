// =============================================================================
// PRISMA CLIENT SINGLETON
// Prevents multiple PrismaClient instances during hot-reload in development.
// Export this `prisma` instance everywhere — never instantiate PrismaClient directly.
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { config } from './env';
import logger from '../utils/logger';

// Declare global to preserve instance across hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      config.server.nodeEnv === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });
}

const prisma: PrismaClient = global.__prisma ?? createPrismaClient();

if (config.server.nodeEnv !== 'production') {
  global.__prisma = prisma;

  // Log slow queries in development
  (prisma as unknown as { $on: (event: string, cb: (e: { duration: number; query: string }) => void) => void })
    .$on('query', (e) => {
      if (e.duration > 100) {
        logger.warn(`[Prisma] Slow query (${e.duration}ms): ${e.query}`);
      }
    });
}

export default prisma;

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('[Prisma] Database connection closed');
}
