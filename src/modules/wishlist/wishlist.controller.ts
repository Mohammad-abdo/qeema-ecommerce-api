import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import {
  addToWishlist,
  listWishlist,
  listWishlistProductIds,
  removeFromWishlist,
  resolveProductIdBySlug,
} from './wishlist.service.js';
import { addWishlistBodySchema, wishlistProductIdParamSchema } from './wishlist.validators.js';

function requireCustomer(request: FastifyRequest) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (user.role !== 'customer') {
    throw new AppError(403, 'Wishlist is for customer accounts', 'FORBIDDEN');
  }
  return user;
}

export async function listWishlistController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireCustomer(request);
  return reply.send({ items: await listWishlist(user.sub) });
}

export async function listWishlistIdsController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireCustomer(request);
  return reply.send({ product_ids: await listWishlistProductIds(user.sub) });
}

export async function addWishlistController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireCustomer(request);
  const parsed = addWishlistBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  let productId = parsed.data.productId;
  if (productId == null && parsed.data.productSlug) {
    productId = await resolveProductIdBySlug(parsed.data.productSlug);
  }
  return reply.send(await addToWishlist(user.sub, productId!));
}

export async function removeWishlistController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireCustomer(request);
  const params = wishlistProductIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await removeFromWishlist(user.sub, params.data.productId));
}
