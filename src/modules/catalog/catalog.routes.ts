import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  createAdminProductController,
  createAdminProductImageController,
  createMerchantProductController,
  getProductAdminController,
  createProductImageController,
  createVariantController,
  deleteMerchantProductController,
  deleteProductImageController,
  deleteVariantController,
  getMerchantProductController,
  getProductBySlugController,
  listPublicCategoriesController,
  listMerchantProductsController,
  listProductsAdminController,
  listProductsController,
  moderateProductAdminController,
  patchMerchantProductController,
  patchVariantController,
} from './catalog.controller.js';

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/api/v1/products', { schema: { tags: ['Catalog'] } }, listProductsController);
  app.get('/api/v1/products/:slug', { schema: { tags: ['Catalog'] } }, getProductBySlugController);
  app.get('/api/v1/categories', { schema: { tags: ['Catalog'] } }, listPublicCategoriesController);

  app.get('/api/v1/admin/catalog/products', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Catalog'] },
  }, listProductsAdminController);

  app.get('/api/v1/admin/catalog/products/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Catalog'] },
  }, getProductAdminController);

  app.post('/api/v1/admin/catalog/products', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Catalog'] },
  }, createAdminProductController);

  app.patch('/api/v1/admin/catalog/products/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Catalog'] },
  }, moderateProductAdminController);

  app.post('/api/v1/admin/catalog/products/:id/images', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Catalog'] },
  }, createAdminProductImageController);

  app.get('/api/v1/merchant/catalog/products', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, listMerchantProductsController);

  app.get('/api/v1/merchant/catalog/products/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, getMerchantProductController);

  app.post('/api/v1/merchant/catalog/products', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, createMerchantProductController);

  app.patch('/api/v1/merchant/catalog/products/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, patchMerchantProductController);

  app.delete('/api/v1/merchant/catalog/products/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, deleteMerchantProductController);

  app.post('/api/v1/merchant/catalog/products/:productId/variants', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, createVariantController);

  app.patch('/api/v1/merchant/catalog/variants/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, patchVariantController);

  app.delete('/api/v1/merchant/catalog/variants/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, deleteVariantController);

  app.post('/api/v1/merchant/catalog/products/:productId/images', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, createProductImageController);

  app.delete('/api/v1/merchant/catalog/product-images/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Catalog'] },
  }, deleteProductImageController);
}
