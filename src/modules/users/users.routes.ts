import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  getUserController,
  listUsersController,
  meController,
  patchMeController,
  patchUserAdminController,
} from './users.controller.js';

export async function usersRoutes(app: FastifyInstance) {
  app.get('/api/v1/users/me', {
    preHandler: [app.authenticate],
    schema: { tags: ['Users'] },
  }, meController);

  app.patch('/api/v1/users/me', {
    preHandler: [app.authenticate],
    schema: { tags: ['Users'] },
  }, patchMeController);

  app.get('/api/v1/users', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Users'] },
  }, listUsersController);

  app.get('/api/v1/users/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['Users'] },
  }, getUserController);

  app.patch('/api/v1/users/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Users'] },
  }, patchUserAdminController);
}
