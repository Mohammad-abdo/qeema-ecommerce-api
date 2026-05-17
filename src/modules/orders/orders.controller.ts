import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { checkoutOrder } from './checkout.service.js';
import {
  addOrderTrackingEvent,
  cancelOrderForCustomer,
  getOrderForUser,
  listOrdersForUser,
  patchOrderForUser,
  patchSubOrderForUser,
} from './orders.service.js';
import { checkoutBodySchema } from './checkout.validators.js';
import {
  createTrackingEventBodySchema,
  orderIdParamSchema,
  orderListUserQuerySchema,
  patchOrderBodySchema,
  patchSubOrderBodySchema,
  subOrderParamsSchema,
} from './orders.validators.js';

export async function listOrdersController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = orderListUserQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listOrdersForUser(user.sub, user.role, parsed.data));
}

export async function getOrderController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = orderIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await getOrderForUser(user.sub, user.role, params.data.id));
}

export async function addOrderTrackingEventController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = orderIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = createTrackingEventBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await addOrderTrackingEvent(user.sub, user.role, params.data.id, parsed.data);
  return reply.code(201).send(row);
}

export async function patchOrderController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = orderIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchOrderBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await patchOrderForUser(user.sub, user.role, params.data.id, parsed.data);
  return reply.send(row);
}

export async function patchSubOrderController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = subOrderParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchSubOrderBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await patchSubOrderForUser(
    user.sub,
    user.role,
    params.data.orderId,
    params.data.subOrderId,
    parsed.data,
  );
  return reply.send(row);
}

export async function checkoutController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (user.role !== 'customer') throw new AppError(403, 'Only customers can checkout', 'FORBIDDEN');
  const parsed = checkoutBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const result = await checkoutOrder(request, reply, user.sub, parsed.data);
  return reply.code(201).send(result);
}

export async function cancelOrderController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (user.role !== 'customer') throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  const params = orderIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const row = await cancelOrderForCustomer(user.sub, params.data.id);
  return reply.send(row);
}
