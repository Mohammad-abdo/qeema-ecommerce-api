import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  addTicketMessageController,
  createTicketController,
  getTicketController,
  listTicketsController,
  patchTicketController,
} from './support.controller.js';

export async function supportRoutes(app: FastifyInstance) {
  app.get('/api/v1/support/tickets', {
    preHandler: [app.authenticate],
    schema: { tags: ['Support'] },
  }, listTicketsController);

  app.post('/api/v1/support/tickets', {
    preHandler: [app.authenticate],
    schema: { tags: ['Support'] },
  }, createTicketController);

  app.get('/api/v1/support/tickets/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['Support'] },
  }, getTicketController);

  app.patch('/api/v1/support/tickets/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Support'] },
  }, patchTicketController);

  app.post('/api/v1/support/tickets/:id/messages', {
    preHandler: [app.authenticate],
    schema: { tags: ['Support'] },
  }, addTicketMessageController);
}
