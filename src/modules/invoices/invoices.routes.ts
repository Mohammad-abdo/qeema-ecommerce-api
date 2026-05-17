import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import { archiveInvoiceController, listInvoicesController } from './invoices.controller.js';

export async function invoicesRoutes(app: FastifyInstance) {
  app.get('/api/v1/invoices', {
    preHandler: [app.authenticate],
    schema: { tags: ['Invoices'] },
  }, listInvoicesController);

  app.post('/api/v1/invoices/:id/archive', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Invoices'] },
  }, archiveInvoiceController);
}
