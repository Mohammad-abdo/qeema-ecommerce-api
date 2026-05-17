import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureTestEnv } from '../ensure-env.js';

describe('HTTP API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ensureTestEnv();
    const { buildApp } = await import('../../src/app.js');
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    const { disconnectPrisma } = await import('../../src/lib/prisma.js');
    const { disconnectRedis } = await import('../../src/lib/redis.js');
    await app.close();
    await disconnectPrisma();
    await disconnectRedis();
  });

  it('GET /health returns 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('GET /health/ready returns 200 or 503 with checks', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect([200, 503]).toContain(res.statusCode);
    const body = res.json() as { status: string; checks: { db: boolean; redis: boolean } };
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('db');
    expect(body.checks).toHaveProperty('redis');
  });
});
