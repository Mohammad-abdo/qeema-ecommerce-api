import type { FastifyInstance } from 'fastify';

import {
  addCartItemController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from './cart.controller.js';

const cartRateLimit = {
  max: 60,
  timeWindow: '1 minute' as const,
};

export async function cartRoutes(app: FastifyInstance) {
  const pre = [app.optionalAuthenticate];

  app.get('/api/v1/cart', {
    preHandler: pre,
    config: { rateLimit: cartRateLimit },
    schema: { tags: ['Cart'] },
  }, getCartController);

  app.post('/api/v1/cart/items', {
    preHandler: pre,
    config: { rateLimit: cartRateLimit },
    schema: { tags: ['Cart'] },
  }, addCartItemController);

  app.put('/api/v1/cart/items/:variantId', {
    preHandler: pre,
    config: { rateLimit: cartRateLimit },
    schema: { tags: ['Cart'] },
  }, updateCartItemController);

  app.delete('/api/v1/cart/items/:variantId', {
    preHandler: pre,
    config: { rateLimit: cartRateLimit },
    schema: { tags: ['Cart'] },
  }, removeCartItemController);

  app.delete('/api/v1/cart', {
    preHandler: pre,
    config: { rateLimit: cartRateLimit },
    schema: { tags: ['Cart'] },
  }, clearCartController);
}
