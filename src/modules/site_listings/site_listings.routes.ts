import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  createSiteListingController,
  listSiteListingsAdminController,
  listSiteListingsMineController,
  listSiteListingsPublicController,
  reviewSiteListingController,
} from './site_listings.controller.js';

export async function siteListingsRoutes(app: FastifyInstance) {
  app.get('/api/v1/site-listings', {
    schema: { tags: ['SiteListings'] },
  }, listSiteListingsPublicController);

  app.get('/api/v1/site-listings/mine', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['SiteListings'] },
  }, listSiteListingsMineController);

  app.get('/api/v1/admin/site-listings', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin', 'employee')],
    schema: { tags: ['SiteListings'] },
  }, listSiteListingsAdminController);

  app.post('/api/v1/site-listings', {
    preHandler: [app.authenticate],
    schema: { tags: ['SiteListings'] },
  }, createSiteListingController);

  app.patch('/api/v1/site-listings/:id/review', {
    preHandler: [app.authenticate, requireRoles('admin', 'super_admin')],
    schema: { tags: ['SiteListings'] },
  }, reviewSiteListingController);
}
