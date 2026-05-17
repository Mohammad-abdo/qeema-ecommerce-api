import type { FastifyInstance } from 'fastify';

import { adminListOrdersController, adminOrdersOverviewController } from './admin-orders.controller.js';

export async function adminOrdersRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/orders/overview', {
    preHandler: [app.authenticate],
    schema: { tags: ['Admin Orders'] },
  }, adminOrdersOverviewController);

  app.get('/api/v1/admin/orders', {
    preHandler: [app.authenticate],
    schema: { tags: ['Admin Orders'] },
  }, adminListOrdersController);
}
