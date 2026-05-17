import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  createBannerCampaignAdminController,
  createStorefrontStoryController,
  deleteBannerCampaignAdminController,
  deleteStorefrontStoryController,
  getStorefrontHomeController,
  getStorefrontPopupsController,
  listBannerCampaignsAdminController,
  listStorefrontStoriesAdminController,
  patchBannerCampaignAdminController,
  patchStorefrontStoryController,
} from './storefront.controller.js';

export async function storefrontRoutes(app: FastifyInstance) {
  app.get('/api/v1/storefront/home', { schema: { tags: ['Storefront'] } }, getStorefrontHomeController);
  app.get('/api/v1/storefront/popups', { schema: { tags: ['Storefront'] } }, getStorefrontPopupsController);

  app.get('/api/v1/admin/storefront/stories', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Storefront'] },
  }, listStorefrontStoriesAdminController);

  app.post('/api/v1/admin/storefront/stories', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Storefront'] },
  }, createStorefrontStoryController);

  app.patch('/api/v1/admin/storefront/stories/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Storefront'] },
  }, patchStorefrontStoryController);

  app.delete('/api/v1/admin/storefront/stories/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Storefront'] },
  }, deleteStorefrontStoryController);

  app.get('/api/v1/admin/storefront/banners', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['Storefront'] },
  }, listBannerCampaignsAdminController);

  app.post('/api/v1/admin/storefront/banners', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Storefront'] },
  }, createBannerCampaignAdminController);

  app.patch('/api/v1/admin/storefront/banners/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Storefront'] },
  }, patchBannerCampaignAdminController);

  app.delete('/api/v1/admin/storefront/banners/:id', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['Storefront'] },
  }, deleteBannerCampaignAdminController);
}
