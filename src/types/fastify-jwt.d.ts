import type { UserRole } from '@prisma/client';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: number; role: UserRole };
    user: { sub: number; role: UserRole };
  }
}
