import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { canManageUsers } from '../../lib/rbac.js';

import type { AdminCreateNotificationBody, NotificationListQuery } from './notifications.validators.js';

export async function listNotifications(userId: number, q: NotificationListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.NotificationWhereInput = { user_id: userId };
  if (q.isRead !== undefined) where.is_read = q.isRead;
  if (q.channel) where.channel = q.channel;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: q.limit,
    }),
    prisma.notification.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, user_id: userId },
  });
  if (!n) throw new AppError(404, 'Notification not found', 'NOT_FOUND');
  return prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true, read_at: new Date() },
  });
}

export async function adminCreateNotification(actorRole: string, body: AdminCreateNotificationBody) {
  if (!canManageUsers(actorRole)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  const u = await prisma.user.findFirst({ where: { id: body.userId, deleted_at: null } });
  if (!u) throw new AppError(404, 'User not found', 'NOT_FOUND');
  return prisma.notification.create({
    data: {
      user_id: body.userId,
      channel: body.channel,
      title: body.title,
      message: body.message,
    },
  });
}
