import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { listPaymentLogs } from './payments.service.js';
import { paymentLogListQuerySchema } from './payments.validators.js';

export async function listPaymentLogsController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = paymentLogListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listPaymentLogs(user.sub, user.role, parsed.data));
}
