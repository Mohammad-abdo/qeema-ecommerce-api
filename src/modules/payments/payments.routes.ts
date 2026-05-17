import type { FastifyInstance } from 'fastify';

import { listPaymentLogsController } from './payments.controller.js';

export async function paymentsRoutes(app: FastifyInstance) {
  app.get('/api/v1/payments/logs', {
    preHandler: [app.authenticate],
    schema: { tags: ['Payments'] },
  }, listPaymentLogsController);
}
