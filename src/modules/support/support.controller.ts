import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { addTicketMessage, createTicket, getTicketForUser, listTickets, patchTicket } from './support.service.js';
import {
  createTicketBodySchema,
  patchTicketBodySchema,
  ticketIdParamSchema,
  ticketListQuerySchema,
  ticketMessageBodySchema,
} from './support.validators.js';

export async function listTicketsController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = ticketListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listTickets(user.sub, user.role, parsed.data));
}

export async function getTicketController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = ticketIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await getTicketForUser(user.sub, user.role, params.data.id));
}

export async function createTicketController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = createTicketBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const ticket = await createTicket(user.sub, user.role, parsed.data);
  return reply.code(201).send(ticket);
}

export async function addTicketMessageController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = ticketIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const body = ticketMessageBodySchema.safeParse(request.body);
  if (!body.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: body.error.flatten() });
  }
  const msg = await addTicketMessage(user.sub, user.role, params.data.id, body.data.message);
  return reply.code(201).send(msg);
}

export async function patchTicketController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = ticketIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchTicketBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await patchTicket(user.sub, user.role, params.data.id, parsed.data));
}
