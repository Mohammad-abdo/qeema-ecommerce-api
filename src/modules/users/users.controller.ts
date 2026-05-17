import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { getMe, getUserById, listUsers, updateMe, updateUserByAdmin } from './users.service.js';
import {
  patchMeBodySchema,
  patchUserAdminBodySchema,
  userIdParamSchema,
  userListQuerySchema,
} from './users.validators.js';

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const data = await getMe(user.sub);
  return reply.send(data);
}

export async function patchMeController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = patchMeBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const data = await updateMe(user.sub, parsed.data);
  return reply.send(data);
}

export async function listUsersController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = userListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const data = await listUsers(parsed.data);
  return reply.send(data);
}

export async function getUserController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = userIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const data = await getUserById(user.sub, user.role, params.data.id);
  return reply.send(data);
}

export async function patchUserAdminController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = userIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchUserAdminBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const data = await updateUserByAdmin(user.role, params.data.id, parsed.data);
  return reply.send(data);
}
