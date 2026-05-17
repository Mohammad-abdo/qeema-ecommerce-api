import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  createMerchantAdminController,
  getMerchantAdminController,
  listMerchantsAdminController,
  listMerchantsPublicController,
  merchantMeController,
  merchantPublicController,
  merchantStorefrontProfileController,
  patchMerchantAdminController,
  patchMyMerchantController,
} from './merchants.controller.js';

export async function merchantsRoutes(app: FastifyInstance) {
  app.get('/api/v1/merchants', {
    schema: { tags: ['Merchants'] },
  }, listMerchantsPublicController);

  app.get('/api/v1/merchants/public/:slug', {
    schema: { tags: ['Merchants'] },
  }, merchantPublicController);

  app.get('/api/v1/merchants/storefront/:slug', {
    schema: { tags: ['Merchants'] },
  }, merchantStorefrontProfileController);

  app.get('/api/v1/merchants/me', {
    preHandler: [app.authenticate],
    schema: { tags: ['Merchants'] },
  }, merchantMeController);

  app.patch('/api/v1/merchants/me', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Merchants'] },
  }, patchMyMerchantController);

  app.get('/api/v1/admin/merchants', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Merchants'] },
  }, listMerchantsAdminController);

  app.get('/api/v1/admin/merchants/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Merchants'] },
  }, getMerchantAdminController);

  app.post('/api/v1/admin/merchants', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Merchants'] },
  }, createMerchantAdminController);

  app.patch('/api/v1/admin/merchants/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Merchants'] },
  }, patchMerchantAdminController);
}
