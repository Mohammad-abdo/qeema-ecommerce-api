import type { FastifyInstance } from 'fastify';

import { prisma } from '../../lib/prisma.js';
import { redis, redisEnabled } from '../../lib/redis.js';

const READY_DB_MS = 3_000;
const READY_REDIS_MS = 2_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', {
    schema: { tags: ['Health'], hide: true },
  }, async (_request, reply) => {
    return reply.send({
      name: 'ERP API',
      status: 'ok',
      docs: '/docs',
      health: '/health',
      api: '/api/v1',
    });
  });

  app.get('/health', {
    schema: {
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  app.get('/health/ready', {
    schema: {
      tags: ['Health'],
      description: 'Readiness: verifies MySQL (and Redis when REDIS_ENABLED=true)',
    },
  }, async (_request, reply) => {
    const checks: { db: boolean; redis: boolean } = { db: false, redis: false };
    try {
      await withTimeout(prisma.$queryRaw`SELECT 1`, READY_DB_MS, 'db');
      checks.db = true;
    } catch {
      checks.db = false;
    }
    if (!redisEnabled || !redis) {
      checks.redis = true;
    } else {
      try {
        const pong = await withTimeout(redis.ping(), READY_REDIS_MS, 'redis');
        checks.redis = pong === 'PONG';
      } catch {
        checks.redis = false;
      }
    }
    const ok = checks.db && (redisEnabled ? checks.redis : true);
    const body = {
      status: ok ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    };
    if (!ok) {
      return reply.code(503).send(body);
    }
    return body;
  });
}
