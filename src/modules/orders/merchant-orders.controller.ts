import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import {
  confirmMerchantSubOrder,
  deliverMerchantSubOrder,
  shipMerchantSubOrder,
} from './merchant-orders.service.js';
import {
  merchantSubOrderIdParamSchema,
  shipSubOrderBodySchema,
} from './merchant-orders.validators.js';

function requireMerchant(request: FastifyRequest) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (user.role !== 'merchant') throw new AppError(403, 'Merchant access only', 'FORBIDDEN');
  return user;
}

export async function confirmSubOrderController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireMerchant(request);
  const params = merchantSubOrderIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const row = await confirmMerchantSubOrder(user.sub, params.data.subOrderId);
  return reply.send(row);
}

export async function shipSubOrderController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireMerchant(request);
  const params = merchantSubOrderIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = shipSubOrderBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await shipMerchantSubOrder(user.sub, params.data.subOrderId, parsed.data);
  return reply.send(row);
}

export async function deliverSubOrderController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireMerchant(request);
  const params = merchantSubOrderIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const row = await deliverMerchantSubOrder(user.sub, params.data.subOrderId);
  return reply.send(row);
}
