import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';
import { isStaffRole } from '../../lib/rbac.js';

import { adminUnifiedSearch } from './admin-search.service.js';
import { adminSearchQuerySchema } from './admin-search.validators.js';

export async function adminSearchController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (!isStaffRole(user.role)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');

  const parsed = adminSearchQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await adminUnifiedSearch(parsed.data.q, parsed.data.limit));
}
