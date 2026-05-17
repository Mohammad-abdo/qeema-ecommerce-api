import { randomBytes } from 'node:crypto';

import type { FastifyReply, FastifyRequest } from 'fastify';

export const ERP_CART_SESSION_COOKIE = 'erp_cart_session';

const CART_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getCartSessionId(request: FastifyRequest): string | null {
  const cookieHeader = request.headers.cookie;
  const match = cookieHeader?.match(/(?:^|;\s*)erp_cart_session=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function ensureCartSessionId(request: FastifyRequest, reply: FastifyReply): string {
  const existing = getCartSessionId(request);
  if (existing) return existing;
  const sessionId = randomBytes(16).toString('hex');
  setCartSessionCookie(reply, sessionId);
  return sessionId;
}

export function setCartSessionCookie(reply: FastifyReply, sessionId: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  reply.header(
    'Set-Cookie',
    `${ERP_CART_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${CART_SESSION_MAX_AGE}${secure}`,
  );
}
