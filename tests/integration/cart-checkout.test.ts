import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureTestEnv } from '../ensure-env.js';

let redisAvailable = false;

describe('Cart and checkout', () => {
  let app: FastifyInstance;
  let customerToken = '';
  let variantId = 0;
  let addressId = 0;
  let sessionCookie = '';

  beforeAll(async () => {
    ensureTestEnv();
    const { redis } = await import('../../src/lib/redis.js');
    try {
      redisAvailable = (await redis.ping()) === 'PONG';
    } catch {
      redisAvailable = false;
    }
    const { buildApp } = await import('../../src/app.js');
    app = await buildApp();
    await app.ready();
    if (!redisAvailable) return;

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'customer@erp.local', password: 'Password123!' },
    });
    expect(loginRes.statusCode).toBe(200);
    const loginBody = loginRes.json() as { accessToken: string };
    customerToken = loginBody.accessToken;

    const productsRes = await app.inject({ method: 'GET', url: '/api/v1/products?limit=1' });
    const products = productsRes.json() as { items: Array<{ variants?: Array<{ id: number }> }> };
    variantId = products.items[0]?.variants?.[0]?.id ?? 0;
    expect(variantId).toBeGreaterThan(0);

    const addrRes = await app.inject({
      method: 'GET',
      url: '/api/v1/addresses',
      headers: { cookie: `erp_access_token=${encodeURIComponent(customerToken)}` },
    });
    if (addrRes.statusCode === 200) {
      const addrBody = addrRes.json() as { items: Array<{ id: number }> };
      addressId = addrBody.items[0]?.id ?? 0;
    }
    if (!addressId) {
      const createAddr = await app.inject({
        method: 'POST',
        url: '/api/v1/addresses',
        headers: {
          cookie: `erp_access_token=${encodeURIComponent(customerToken)}`,
          'content-type': 'application/json',
        },
        payload: {
          full_name: 'Test Customer',
          country: 'EG',
          city: 'Cairo',
          street: 'Test St',
          is_default: true,
        },
      });
      expect(createAddr.statusCode).toBe(201);
      addressId = (createAddr.json() as { id: number }).id;
    }
  });

  afterAll(async () => {
    const { disconnectPrisma } = await import('../../src/lib/prisma.js');
    const { disconnectRedis } = await import('../../src/lib/redis.js');
    await app.close();
    await disconnectPrisma();
    await disconnectRedis();
  });

  it.skipIf(!redisAvailable)('guest can add to cart and get cart', async () => {
    const addRes = await app.inject({
      method: 'POST',
      url: '/api/v1/cart/items',
      headers: { 'content-type': 'application/json' },
      payload: { variant_id: variantId, quantity: 1 },
    });
    expect(addRes.statusCode).toBe(200);
    sessionCookie = addRes.headers['set-cookie']?.[0] ?? '';
    expect(sessionCookie).toContain('erp_cart_session');

    const cartRes = await app.inject({
      method: 'GET',
      url: '/api/v1/cart',
      headers: { cookie: sessionCookie.split(';')[0] },
    });
    expect(cartRes.statusCode).toBe(200);
    const cart = cartRes.json() as { item_count: number };
    expect(cart.item_count).toBeGreaterThanOrEqual(1);
  });

  it.skipIf(!redisAvailable)('customer can checkout with COD', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/cart/items',
      headers: {
        cookie: `erp_access_token=${encodeURIComponent(customerToken)}`,
        'content-type': 'application/json',
      },
      payload: { variant_id: variantId, quantity: 1 },
    });

    const checkoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/checkout',
      headers: {
        cookie: `erp_access_token=${encodeURIComponent(customerToken)}`,
        'content-type': 'application/json',
      },
      payload: { address_id: addressId, payment_method: 'cod' },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const order = checkoutRes.json() as { order_id: number; order_number: string };
    expect(order.order_id).toBeGreaterThan(0);
    expect(order.order_number).toMatch(/^ORD-/);
  });
});
