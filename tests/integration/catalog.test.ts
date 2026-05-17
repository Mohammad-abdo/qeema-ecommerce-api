import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureTestEnv } from '../ensure-env.js';

describe('Public catalog API', () => {
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

  it('GET /api/v1/products returns paginated list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/products?limit=2' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: unknown[]; total: number };
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('GET /api/v1/categories returns legacy shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/categories' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/v1/storefront/home returns payload', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/storefront/home' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { success: boolean };
    expect(body.success).toBe(true);
  });
});
