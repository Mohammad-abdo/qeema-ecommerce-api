import type { FastifyInstance } from 'fastify';

import {
  adminGetSettingsController,
  adminPatchSettingsController,
  publicSettingsController,
} from './settings.controller.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/api/v1/settings/public', {
    schema: { tags: ['Settings'] },
  }, publicSettingsController);

  app.get('/api/v1/admin/settings', {
    preHandler: [app.authenticate],
    schema: { tags: ['Settings'] },
  }, adminGetSettingsController);

  app.patch('/api/v1/admin/settings', {
    preHandler: [app.authenticate],
    schema: { tags: ['Settings'] },
  }, adminPatchSettingsController);
}
