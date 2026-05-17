import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';
import { clearAccessTokenCookie, setAccessTokenCookie } from '../../lib/auth-cookie.js';

import { getCartSessionId } from '../../lib/cart-cookie.js';
import { mergeGuestCartIntoUser } from '../cart/cart.service.js';

import { login, logoutUser, register } from './auth.service.js';
import { oauthLogin } from './oauth.service.js';
import { loginBodySchema, oauthBodySchema, registerBodySchema } from './auth.validators.js';

export async function loginController(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const result = await login(app, parsed.data);
  setAccessTokenCookie(reply, result.accessToken);
  const sessionId = getCartSessionId(request);
  if (sessionId && result.user.role === 'customer') {
    await mergeGuestCartIntoUser(sessionId, result.user.id);
  }
  return reply.send(result);
}

export async function registerController(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const parsed = registerBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const result = await register(app, parsed.data);
  setAccessTokenCookie(reply, result.accessToken);
  return reply.code(201).send(result);
}

export async function oauthController(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const parsed = oauthBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const result = await oauthLogin(app, parsed.data);
  setAccessTokenCookie(reply, result.accessToken);
  const sessionId = getCartSessionId(request);
  if (sessionId && result.user.role === 'customer') {
    await mergeGuestCartIntoUser(sessionId, result.user.id);
  }
  return reply.send(result);
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  await logoutUser(user.sub);
  clearAccessTokenCookie(reply);
  return reply.code(204).send();
}
