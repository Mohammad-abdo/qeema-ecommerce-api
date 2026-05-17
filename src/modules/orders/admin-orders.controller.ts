import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';
import { isStaffRole } from '../../lib/rbac.js';

import { getAdminOrdersOverview, listAdminOrders } from './admin-orders.service.js';
import { adminOrderListQuerySchema } from './admin-orders.validators.js';

function requireStaff(request: FastifyRequest) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (!isStaffRole(user.role)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return user;
}

export async function adminOrdersOverviewController(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  return reply.send(await getAdminOrdersOverview());
}

export async function adminListOrdersController(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  const parsed = adminOrderListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listAdminOrders(parsed.data));
}
