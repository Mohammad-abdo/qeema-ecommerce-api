import type { FastifyInstance } from 'fastify';

import { adminSearchController } from './admin-search.controller.js';

export async function adminSearchRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/search', {
    preHandler: [app.authenticate],
    schema: { tags: ['Admin Search'] },
  }, adminSearchController);
}
