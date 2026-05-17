import type { Prisma } from '@prisma/client';

import { prisma } from './prisma.js';
import { queueEmail } from './email.js';

export async function createInAppNotification(
  userId: number,
  title: string,
  message: string,
  payload?: Record<string, unknown>,
) {
  const prefs = await prisma.notificationPreference.findUnique({ where: { user_id: userId } });
  if (prefs && !prefs.order_updates) return null;

  return prisma.notification.create({
    data: {
      user_id: userId,
      channel: 'in_app',
      title,
      message,
      payload: (payload ?? undefined) as Prisma.InputJsonValue | undefined,
      sent_at: new Date(),
    },
  });
}

export async function queueOrderShippedEmail(orderId: number, subOrderId: number, trackingNumber: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deleted_at: null },
    include: {
      customer: { select: { id: true, email: true, name: true } },
    },
  });
  if (!order?.customer) return;

  const title = `Order ${order.order_number} shipped`;
  const message = `Your order has been shipped. Tracking number: ${trackingNumber}.`;

  await createInAppNotification(order.customer.id, title, message, {
    orderId,
    subOrderId,
    trackingNumber,
  });

  const prefs = await prisma.notificationPreference.findUnique({
    where: { user_id: order.customer.id },
  });
  if (prefs && !prefs.email_enabled) return;

  await queueEmail('order.shipped', {
    to: order.customer.email,
    subject: title,
    text: `Hi ${order.customer.name},\n\n${message}\n\nThank you for shopping with us.`,
    orderId,
    subOrderId,
  });
}

export async function queueOrderDeliveredEmail(orderId: number, subOrderId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deleted_at: null },
    include: { customer: { select: { id: true, email: true, name: true } } },
  });
  if (!order?.customer) return;

  const title = `Order ${order.order_number} delivered`;
  const message = 'Your order has been delivered. Thank you for your purchase (cash on delivery).';

  await createInAppNotification(order.customer.id, title, message, { orderId, subOrderId });

  const prefs = await prisma.notificationPreference.findUnique({
    where: { user_id: order.customer.id },
  });
  if (prefs && !prefs.email_enabled) return;

  await queueEmail('order.delivered', {
    to: order.customer.email,
    subject: title,
    text: `Hi ${order.customer.name},\n\n${message}`,
    orderId,
    subOrderId,
  });
}
