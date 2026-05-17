import type { FastifyInstance } from 'fastify';

import {
  addWishlistController,
  listWishlistController,
  listWishlistIdsController,
  removeWishlistController,
} from './wishlist.controller.js';

export async function wishlistRoutes(app: FastifyInstance) {
  app.get('/api/v1/wishlist', {
    preHandler: [app.authenticate],
    schema: { tags: ['Wishlist'] },
  }, listWishlistController);

  app.get('/api/v1/wishlist/ids', {
    preHandler: [app.authenticate],
    schema: { tags: ['Wishlist'] },
  }, listWishlistIdsController);

  app.post('/api/v1/wishlist', {
    preHandler: [app.authenticate],
    schema: { tags: ['Wishlist'] },
  }, addWishlistController);

  app.delete('/api/v1/wishlist/:productId', {
    preHandler: [app.authenticate],
    schema: { tags: ['Wishlist'] },
  }, removeWishlistController);
}
