import type { FastifyInstance } from 'fastify';

import {
  createReportRunController,
  listReportDefinitionsController,
  listReportRunsController,
} from './reports.controller.js';

export async function reportsRoutes(app: FastifyInstance) {
  app.get('/api/v1/reports/definitions', {
    preHandler: [app.authenticate],
    schema: { tags: ['Reports'] },
  }, listReportDefinitionsController);

  app.get('/api/v1/reports/runs', {
    preHandler: [app.authenticate],
    schema: { tags: ['Reports'] },
  }, listReportRunsController);

  app.post('/api/v1/reports/runs', {
    preHandler: [app.authenticate],
    schema: { tags: ['Reports'] },
  }, createReportRunController);
}
