import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { syncEsyasatgoProducts } from './integrations.service.js';
import { esyasatgoSyncBodySchema } from './integrations.validators.js';

export async function syncEsyasatgoController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = esyasatgoSyncBodySchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const result = await syncEsyasatgoProducts(parsed.data.maxPages);
  return reply.send(result);
}
