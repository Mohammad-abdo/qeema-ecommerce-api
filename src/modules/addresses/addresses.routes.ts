import type { FastifyInstance } from 'fastify';

import { createAddressController, listAddressesController } from './addresses.controller.js';

export async function addressesRoutes(app: FastifyInstance) {
  app.get('/api/v1/addresses', {
    preHandler: [app.authenticate],
    schema: { tags: ['Addresses'] },
  }, listAddressesController);

  app.post('/api/v1/addresses', {
    preHandler: [app.authenticate],
    schema: { tags: ['Addresses'] },
  }, createAddressController);
}
