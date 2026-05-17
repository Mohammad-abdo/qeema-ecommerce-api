import type { FastifyReply, FastifyRequest } from 'fastify';

import { adminSearchIndexListQuerySchema, searchQuerySchema } from './search.validators.js';
import { reindexPublishedProducts } from './search.reindex.js';
import { listSearchIndexAdmin, searchProducts } from './search.service.js';

export async function searchController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = searchQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send({ items: await searchProducts(parsed.data) });
}

export async function listSearchIndexAdminController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminSearchIndexListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listSearchIndexAdmin(parsed.data));
}

export async function reindexSearchController(_request: FastifyRequest, reply: FastifyReply) {
  const result = await reindexPublishedProducts();
  return reply.send(result);
}
