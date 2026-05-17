import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { adminCreateNotification, listNotifications, markNotificationRead } from './notifications.service.js';
import {
  adminCreateNotificationBodySchema,
  notificationIdParamSchema,
  notificationListQuerySchema,
} from './notifications.validators.js';

export async function listNotificationsController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = notificationListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listNotifications(user.sub, parsed.data));
}

export async function markNotificationReadController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = notificationIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await markNotificationRead(user.sub, params.data.id));
}

export async function adminCreateNotificationController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = adminCreateNotificationBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await adminCreateNotification(user.role, parsed.data);
  return reply.code(201).send(row);
}
