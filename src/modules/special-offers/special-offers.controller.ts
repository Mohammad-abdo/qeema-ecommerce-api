import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  createSpecialOfferAdminBodySchema,
  createSpecialOfferMerchantBodySchema,
  patchSpecialOfferBodySchema,
  publicSpecialOfferListQuerySchema,
  specialOfferIdParamSchema,
  specialOfferListQuerySchema,
  specialOfferSlugParamSchema,
} from './special-offers.validators.js';
import {
  createSpecialOfferAdmin,
  createSpecialOfferMerchant,
  deleteSpecialOfferAdmin,
  deleteSpecialOfferMerchant,
  getPublicSpecialOfferBySlug,
  getSpecialOfferAdmin,
  getSpecialOfferMerchant,
  listPublicSpecialOffers,
  listSpecialOffersAdmin,
  listSpecialOffersMerchant,
  patchSpecialOfferAdmin,
  patchSpecialOfferMerchant,
} from './special-offers.service.js';

function parseQuery<T>(schema: { parse: (v: unknown) => T }, request: FastifyRequest): T {
  return schema.parse(request.query);
}

export async function listPublicSpecialOffersController(request: FastifyRequest, reply: FastifyReply) {
  const q = parseQuery(publicSpecialOfferListQuerySchema, request);
  return reply.send(await listPublicSpecialOffers(q));
}

export async function getPublicSpecialOfferController(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = specialOfferSlugParamSchema.parse(request.params);
  return reply.send(await getPublicSpecialOfferBySlug(slug));
}

export async function listSpecialOffersAdminController(request: FastifyRequest, reply: FastifyReply) {
  const q = parseQuery(specialOfferListQuerySchema, request);
  return reply.send(await listSpecialOffersAdmin(q));
}

export async function getSpecialOfferAdminController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = specialOfferIdParamSchema.parse(request.params);
  return reply.send(await getSpecialOfferAdmin(id));
}

export async function createSpecialOfferAdminController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user!;
  const body = createSpecialOfferAdminBodySchema.parse(request.body);
  return reply.code(201).send(await createSpecialOfferAdmin(user.sub, body));
}

export async function patchSpecialOfferAdminController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = specialOfferIdParamSchema.parse(request.params);
  const body = patchSpecialOfferBodySchema.parse(request.body);
  return reply.send(await patchSpecialOfferAdmin(id, body));
}

export async function deleteSpecialOfferAdminController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = specialOfferIdParamSchema.parse(request.params);
  return reply.send(await deleteSpecialOfferAdmin(id));
}

export async function listSpecialOffersMerchantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user!;
  const q = parseQuery(specialOfferListQuerySchema, request);
  return reply.send(await listSpecialOffersMerchant(user.sub, q));
}

export async function getSpecialOfferMerchantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user!;
  const { id } = specialOfferIdParamSchema.parse(request.params);
  return reply.send(await getSpecialOfferMerchant(user.sub, id));
}

export async function createSpecialOfferMerchantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user!;
  const body = createSpecialOfferMerchantBodySchema.parse(request.body);
  return reply.code(201).send(await createSpecialOfferMerchant(user.sub, body));
}

export async function patchSpecialOfferMerchantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user!;
  const { id } = specialOfferIdParamSchema.parse(request.params);
  const body = patchSpecialOfferBodySchema.parse(request.body);
  return reply.send(await patchSpecialOfferMerchant(user.sub, id, body));
}

export async function deleteSpecialOfferMerchantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user!;
  const { id } = specialOfferIdParamSchema.parse(request.params);
  return reply.send(await deleteSpecialOfferMerchant(user.sub, id));
}
