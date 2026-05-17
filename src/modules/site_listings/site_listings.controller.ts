import type { FastifyReply, FastifyRequest } from 'fastify';

import { paginationQuerySchema } from '../../lib/pagination.js';
import { AppError } from '../../lib/errors.js';

import {
  createSiteListing,
  listPublishedSiteListings,
  listSiteListingsAdmin,
  listSiteListingsForMerchant,
  reviewSiteListing,
} from './site_listings.service.js';
import {
  createSiteListingBodySchema,
  reviewSiteListingBodySchema,
  siteListingAdminListQuerySchema,
  siteListingIdParamSchema,
  siteListingMerchantListQuerySchema,
} from './site_listings.validators.js';

export async function listSiteListingsPublicController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = paginationQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const categoryRaw = (request.query as Record<string, unknown> | undefined)?.categoryId;
  const categoryId =
    categoryRaw != null && categoryRaw !== '' ? Number(categoryRaw) : undefined;
  const cid = categoryId != null && Number.isFinite(categoryId) && categoryId > 0 ? categoryId : undefined;
  return reply.send(await listPublishedSiteListings(parsed.data, cid));
}

export async function createSiteListingController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (user.role !== 'merchant' && user.role !== 'admin' && user.role !== 'super_admin') {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  const parsed = createSiteListingBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createSiteListing(user.sub, user.role, parsed.data);
  return reply.code(201).send(row);
}

export async function reviewSiteListingController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = siteListingIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = reviewSiteListingBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await reviewSiteListing(user.sub, params.data.id, parsed.data));
}

export async function listSiteListingsAdminController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = siteListingAdminListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listSiteListingsAdmin(parsed.data));
}

export async function listSiteListingsMineController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = siteListingMerchantListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listSiteListingsForMerchant(user.sub, parsed.data));
}
