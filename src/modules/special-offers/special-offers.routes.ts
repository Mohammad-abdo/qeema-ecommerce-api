import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  createSpecialOfferAdminController,
  createSpecialOfferMerchantController,
  deleteSpecialOfferAdminController,
  deleteSpecialOfferMerchantController,
  getPublicSpecialOfferController,
  getSpecialOfferAdminController,
  getSpecialOfferMerchantController,
  listPublicSpecialOffersController,
  listSpecialOffersAdminController,
  listSpecialOffersMerchantController,
  patchSpecialOfferAdminController,
  patchSpecialOfferMerchantController,
} from './special-offers.controller.js';

export async function specialOffersRoutes(app: FastifyInstance) {
  app.get('/api/v1/special-offers', {
    schema: { tags: ['Special Offers'] },
  }, listPublicSpecialOffersController);

  app.get('/api/v1/special-offers/:slug', {
    schema: { tags: ['Special Offers'] },
  }, getPublicSpecialOfferController);

  app.get('/api/v1/admin/special-offers', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Special Offers'] },
  }, listSpecialOffersAdminController);

  app.get('/api/v1/admin/special-offers/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Special Offers'] },
  }, getSpecialOfferAdminController);

  app.post('/api/v1/admin/special-offers', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Special Offers'] },
  }, createSpecialOfferAdminController);

  app.patch('/api/v1/admin/special-offers/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Special Offers'] },
  }, patchSpecialOfferAdminController);

  app.delete('/api/v1/admin/special-offers/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Special Offers'] },
  }, deleteSpecialOfferAdminController);

  app.get('/api/v1/merchant/special-offers', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Special Offers'] },
  }, listSpecialOffersMerchantController);

  app.get('/api/v1/merchant/special-offers/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Special Offers'] },
  }, getSpecialOfferMerchantController);

  app.post('/api/v1/merchant/special-offers', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Special Offers'] },
  }, createSpecialOfferMerchantController);

  app.patch('/api/v1/merchant/special-offers/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Special Offers'] },
  }, patchSpecialOfferMerchantController);

  app.delete('/api/v1/merchant/special-offers/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Special Offers'] },
  }, deleteSpecialOfferMerchantController);
}
