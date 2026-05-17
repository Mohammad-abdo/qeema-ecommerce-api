import { NotifChannel } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const notificationListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    isRead: z.coerce.boolean().optional(),
    channel: z.nativeEnum(NotifChannel).optional(),
  });

export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const adminCreateNotificationBodySchema = z.object({
  userId: z.coerce.number().int().positive(),
  channel: z.nativeEnum(NotifChannel).default('in_app'),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(10000),
});

export type AdminCreateNotificationBody = z.infer<typeof adminCreateNotificationBodySchema>;
