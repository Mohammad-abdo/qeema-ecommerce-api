import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  adminCreateNotificationController,
  listNotificationsController,
  markNotificationReadController,
} from './notifications.controller.js';

export async function notificationsRoutes(app: FastifyInstance) {
  app.get('/api/v1/notifications', {
    preHandler: [app.authenticate],
    schema: { tags: ['Notifications'] },
  }, listNotificationsController);

  app.patch('/api/v1/notifications/:id/read', {
    preHandler: [app.authenticate],
    schema: { tags: ['Notifications'] },
  }, markNotificationReadController);

  app.post('/api/v1/admin/notifications', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Notifications'] },
  }, adminCreateNotificationController);
}
