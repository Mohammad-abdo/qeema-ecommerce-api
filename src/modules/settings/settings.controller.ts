import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';
import { isStaffRole } from '../../lib/rbac.js';

import { getAdminSettings, getPublicSettings, patchAdminSettings } from './settings.service.js';
import { patchAdminSettingsBodySchema } from './settings.validators.js';

function requireStaff(request: FastifyRequest) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  if (!isStaffRole(user.role)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}

export async function publicSettingsController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await getPublicSettings());
}

export async function adminGetSettingsController(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  return reply.send(await getAdminSettings());
}

export async function adminPatchSettingsController(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  const parsed = patchAdminSettingsBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await patchAdminSettings(parsed.data));
}
