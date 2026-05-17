import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import { syncEsyasatgoController } from './integrations.controller.js';

export async function integrationsRoutes(app: FastifyInstance) {
  app.post('/api/v1/admin/integrations/esyasatgo/sync', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Integrations'] },
  }, syncEsyasatgoController);
}
