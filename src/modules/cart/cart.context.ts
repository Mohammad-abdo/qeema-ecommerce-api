import type { FastifyReply, FastifyRequest } from 'fastify';

import { ensureCartSessionId, getCartSessionId } from '../../lib/cart-cookie.js';

import { guestCartKey, userCartKey } from './cart.redis.js';
import type { CartContext } from './cart.types.js';

export function resolveCartContext(
  request: FastifyRequest,
  reply: FastifyReply,
  userId?: number,
): CartContext {
  if (userId != null) {
    return {
      redisKey: userCartKey(userId),
      cartId: `user:${userId}`,
      isGuest: false,
      userId,
    };
  }
  const sessionId = getCartSessionId(request) ?? ensureCartSessionId(request, reply);
  return {
    redisKey: guestCartKey(sessionId),
    cartId: `guest:${sessionId}`,
    isGuest: true,
    sessionId,
  };
}
