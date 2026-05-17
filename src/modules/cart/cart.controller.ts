import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from './cart.service.js';
import {
  addCartItemBodySchema,
  updateCartItemBodySchema,
  variantIdParamSchema,
} from './cart.validators.js';

function optionalUserId(request: FastifyRequest): number | undefined {
  const user = request.user;
  if (!user || user.role !== 'customer') return undefined;
  return user.sub;
}

export async function getCartController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await getCart(request, reply, optionalUserId(request)));
}

export async function addCartItemController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = addCartItemBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await addCartItem(request, reply, parsed.data, optionalUserId(request)));
}

export async function updateCartItemController(request: FastifyRequest, reply: FastifyReply) {
  const params = variantIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = updateCartItemBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(
    await updateCartItem(request, reply, params.data.variantId, parsed.data, optionalUserId(request)),
  );
}

export async function removeCartItemController(request: FastifyRequest, reply: FastifyReply) {
  const params = variantIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(
    await removeCartItem(request, reply, params.data.variantId, optionalUserId(request)),
  );
}

export async function clearCartController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await clearCart(request, reply, optionalUserId(request)));
}
