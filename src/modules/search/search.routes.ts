import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  listSearchIndexAdminController,
  reindexSearchController,
  searchController,
} from './search.controller.js';

export async function searchRoutes(app: FastifyInstance) {
  app.get('/api/v1/search', { schema: { tags: ['Search'] } }, searchController);

  app.get('/api/v1/admin/search-index', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Search'] },
  }, listSearchIndexAdminController);

  app.post('/api/v1/admin/search-index/reindex', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Search'] },
  }, reindexSearchController);
}
