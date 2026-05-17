import type { FastifyInstance } from 'fastify';

import {
  confirmSubOrderController,
  deliverSubOrderController,
  shipSubOrderController,
} from './merchant-orders.controller.js';

export async function merchantOrdersRoutes(app: FastifyInstance) {
  const pre = [app.authenticate];

  app.put('/api/v1/merchant/orders/:subOrderId/confirm', {
    preHandler: pre,
    schema: { tags: ['Merchant Orders'] },
  }, confirmSubOrderController);

  app.put('/api/v1/merchant/orders/:subOrderId/ship', {
    preHandler: pre,
    schema: { tags: ['Merchant Orders'] },
  }, shipSubOrderController);

  app.put('/api/v1/merchant/orders/:subOrderId/deliver', {
    preHandler: pre,
    schema: { tags: ['Merchant Orders'] },
  }, deliverSubOrderController);
}
