import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import {
  createMerchantAdmin,
  getMerchantAdmin,
  getMerchantPublicBySlug,
  getMyMerchant,
  listMerchantsAdmin,
  listMerchantsPublic,
  updateMerchantAdmin,
  updateMyMerchant,
} from './merchants.service.js';
import { getMerchantStorefrontProfile } from './merchants.storefront.js';
import {
  createMerchantAdminBodySchema,
  merchantIdParamSchema,
  merchantListQuerySchema,
  patchMerchantAdminBodySchema,
  patchMyMerchantBodySchema,
  publicMerchantListQuerySchema,
} from './merchants.validators.js';

export async function listMerchantsPublicController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = publicMerchantListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listMerchantsPublic(parsed.data));
}

export async function merchantPublicController(request: FastifyRequest, reply: FastifyReply) {
  const slug = String((request.params as { slug: string }).slug ?? '');
  if (!slug) return reply.code(400).send({ message: 'Missing slug' });
  return reply.send(await getMerchantPublicBySlug(slug));
}

export async function merchantStorefrontProfileController(request: FastifyRequest, reply: FastifyReply) {
  const slug = String((request.params as { slug: string }).slug ?? '');
  if (!slug) return reply.code(400).send({ message: 'Missing slug' });
  return reply.send(await getMerchantStorefrontProfile(slug));
}

export async function merchantMeController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  return reply.send(await getMyMerchant(user.sub));
}

export async function getMerchantAdminController(request: FastifyRequest, reply: FastifyReply) {
  const params = merchantIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await getMerchantAdmin(params.data.id));
}

export async function createMerchantAdminController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createMerchantAdminBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createMerchantAdmin(parsed.data);
  return reply.code(201).send(row);
}

export async function listMerchantsAdminController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = merchantListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listMerchantsAdmin(parsed.data));
}

export async function patchMerchantAdminController(request: FastifyRequest, reply: FastifyReply) {
  const params = merchantIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchMerchantAdminBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await updateMerchantAdmin(params.data.id, parsed.data));
}

export async function patchMyMerchantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = patchMyMerchantBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await updateMyMerchant(user.sub, parsed.data));
}
