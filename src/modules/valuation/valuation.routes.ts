import type { FastifyInstance } from 'fastify';

import { createValuationController, uploadValuationImageController } from './valuation.controller.js';

export async function valuationRoutes(app: FastifyInstance) {
  app.post('/api/v1/valuation', {
    schema: { tags: ['Valuation'] },
  }, createValuationController);

  app.post('/api/v1/valuation/upload', {
    schema: { tags: ['Valuation'] },
  }, uploadValuationImageController);
}
