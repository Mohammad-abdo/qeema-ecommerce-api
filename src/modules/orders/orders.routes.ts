import type { FastifyInstance } from 'fastify';

import {
  addOrderTrackingEventController,
  cancelOrderController,
  checkoutController,
  getOrderController,
  listOrdersController,
  patchOrderController,
  patchSubOrderController,
} from './orders.controller.js';

const checkoutRateLimit = { max: 10, timeWindow: '1 minute' as const };

export async function ordersRoutes(app: FastifyInstance) {
  app.post('/api/v1/orders/checkout', {
    preHandler: [app.authenticate],
    config: { rateLimit: checkoutRateLimit },
    schema: { tags: ['Orders'] },
  }, checkoutController);

  app.delete('/api/v1/orders/:id/cancel', {
    preHandler: [app.authenticate],
    schema: { tags: ['Orders'] },
  }, cancelOrderController);

  app.get('/api/v1/orders', {
    preHandler: [app.authenticate],
    schema: { tags: ['Orders'] },
  }, listOrdersController);

  app.get('/api/v1/orders/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['Orders'] },
  }, getOrderController);

  app.patch('/api/v1/orders/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['Orders'] },
  }, patchOrderController);

  app.patch('/api/v1/orders/:orderId/sub-orders/:subOrderId', {
    preHandler: [app.authenticate],
    schema: { tags: ['Orders'] },
  }, patchSubOrderController);

  app.post('/api/v1/orders/:id/tracking-events', {
    preHandler: [app.authenticate],
    schema: { tags: ['Orders'] },
  }, addOrderTrackingEventController);
}
