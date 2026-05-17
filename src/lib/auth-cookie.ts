import { env } from '../config/env.js';

export const ERP_ACCESS_COOKIE = 'erp_access_token';

function jwtMaxAgeSeconds(): number {
  const raw = env.JWT_EXPIRES_IN.trim();
  const m = /^(\d+)([smhd])$/i.exec(raw);
  if (!m) return 60 * 60 * 24;
  const n = Number(m[1]);
  const unit = (m[2] ?? 'h').toLowerCase();
  if (unit === 's') return n;
  if (unit === 'm') return n * 60;
  if (unit === 'h') return n * 3600;
  return n * 86400;
}

export function setAccessTokenCookie(reply: import('fastify').FastifyReply, token: string) {
  const maxAge = jwtMaxAgeSeconds();
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  reply.header(
    'Set-Cookie',
    `${ERP_ACCESS_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  );
}

export function clearAccessTokenCookie(reply: import('fastify').FastifyReply) {
  reply.header(
    'Set-Cookie',
    `${ERP_ACCESS_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  );
}
