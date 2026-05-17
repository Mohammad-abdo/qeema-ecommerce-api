import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { createAddressForUser, listAddressesForUser } from './addresses.service.js';
import { createAddressBodySchema } from './addresses.validators.js';

export async function listAddressesController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (user.role !== 'customer') throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return reply.send({ items: await listAddressesForUser(user.sub) });
}

export async function createAddressController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (user.role !== 'customer') throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  const parsed = createAddressBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createAddressForUser(user.sub, parsed.data);
  return reply.code(201).send(row);
}
