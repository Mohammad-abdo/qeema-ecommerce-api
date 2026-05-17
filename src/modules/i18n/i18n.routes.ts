import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  getTranslationsController,
  listAdminI18nKeysController,
  listLocalesController,
  patchAdminI18nTranslationController,
} from './i18n.controller.js';

export async function i18nRoutes(app: FastifyInstance) {
  app.get('/api/v1/i18n/locales', { schema: { tags: ['I18n'] } }, listLocalesController);
  app.get('/api/v1/i18n/translations', { schema: { tags: ['I18n'] } }, getTranslationsController);

  app.get('/api/v1/admin/i18n/keys', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['I18n'] },
  }, listAdminI18nKeysController);

  app.patch('/api/v1/admin/i18n/translations', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['I18n'] },
  }, patchAdminI18nTranslationController);
}
