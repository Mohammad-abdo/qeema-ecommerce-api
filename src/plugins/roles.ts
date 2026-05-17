import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '@prisma/client';

import { AppError } from '../lib/errors.js';

export function requireRoles(...allowed: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user;
    if (!user || !allowed.includes(user.role)) {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    }
  };
}
