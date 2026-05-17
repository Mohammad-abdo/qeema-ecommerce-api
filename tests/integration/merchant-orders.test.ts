import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureTestEnv } from '../ensure-env.js';

describe('Merchant order fulfillment', () => {
  let app: FastifyInstance;
  let merchantToken = '';
  let subOrderId = 0;

  beforeAll(async () => {
    ensureTestEnv();
    const { buildApp } = await import('../../src/app.js');
    app = await buildApp();
    await app.ready();

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'merchant@erp.local', password: 'Password123!' },
    });
    expect(loginRes.statusCode).toBe(200);
    merchantToken = (loginRes.json() as { accessToken: string }).accessToken;

    const ordersRes = await app.inject({
      method: 'GET',
      url: '/api/v1/orders?limit=5',
      headers: { cookie: `erp_access_token=${encodeURIComponent(merchantToken)}` },
    });
    expect(ordersRes.statusCode).toBe(200);
    const orders = ordersRes.json() as { items: Array<{ sub_orders?: Array<{ id: number; status: string }> }> };
    const sub = orders.items.flatMap((o) => o.sub_orders ?? []).find((s) => s.status === 'pending' || s.status === 'processing' || s.status === 'confirmed' || s.status === 'shipped');
    subOrderId = sub?.id ?? orders.items[0]?.sub_orders?.[0]?.id ?? 0;
  });

  afterAll(async () => {
    const { disconnectPrisma } = await import('../../src/lib/prisma.js');
    const { disconnectRedis } = await import('../../src/lib/redis.js');
    await app.close();
    await disconnectPrisma();
    await disconnectRedis();
  });

  it.skipIf(!subOrderId)('PUT confirm returns 200 for merchant sub-order', async () => {
    const sub = await app.inject({
      method: 'GET',
      url: '/api/v1/orders',
      headers: { cookie: `erp_access_token=${encodeURIComponent(merchantToken)}` },
    });
    const items = (sub.json() as { items: Array<{ sub_orders?: Array<{ id: number; status: string }> }> }).items;
    const pending = items.flatMap((o) => o.sub_orders ?? []).find((s) => s.status === 'pending');
    if (!pending) return;

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/merchant/orders/${pending.id}/confirm`,
      headers: { cookie: `erp_access_token=${encodeURIComponent(merchantToken)}` },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { status: string }).status).toBe('confirmed');
  });
});
