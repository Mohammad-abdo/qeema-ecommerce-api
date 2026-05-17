import type { PrismaClient } from '@prisma/client';

import type { SeedUsers } from './types.ts';

export async function seedNotifications(prisma: PrismaClient, users: SeedUsers) {
  const tpl = await prisma.notificationTemplate.create({
    data: {
      code: 'order.shipped',
      channel_default: 'in_app',
      title_template: 'Order {{orderNumber}} shipped',
      message_template: 'Your order is on the way.',
      is_active: true,
    },
  });

  await prisma.notification.create({
    data: {
      user_id: users.customerId,
      channel: 'in_app',
      title: 'Welcome',
      message: 'Thanks for joining the ERP demo.',
      notification_template_id: tpl.id,
    },
  });
}
