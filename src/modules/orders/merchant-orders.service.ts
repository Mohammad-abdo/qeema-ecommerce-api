import type { OrderStatus, Prisma, SubOrderStatus } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';

import { queueOrderDeliveredEmail, queueOrderShippedEmail } from '../../lib/order-notifications.js';

import {
  ensureCommissionForSubOrder,
  scheduleCommissionClearing,
} from './commission.service.js';
import type { ShipSubOrderBody } from './merchant-orders.validators.js';

async function getMerchantSubOrder(userId: number, subOrderId: number) {
  const mid = await merchantIdForUser(userId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');

  const sub = await prisma.subOrder.findFirst({
    where: { id: subOrderId, merchant_id: mid, deleted_at: null },
    include: { order: true },
  });
  if (!sub) throw new AppError(404, 'Sub-order not found', 'NOT_FOUND');
  return { sub, merchantId: mid };
}

async function createTrackingEvent(
  tx: Prisma.TransactionClient,
  orderId: number,
  subOrderId: number,
  userId: number,
  eventCode: string,
  title: string,
  description?: string,
  extra?: { carrier_code?: string; external_tracking_id?: string },
) {
  await tx.orderTrackingEvent.create({
    data: {
      order_id: orderId,
      sub_order_id: subOrderId,
      actor_type: 'merchant',
      actor_user_id: userId,
      event_code: eventCode,
      title,
      description,
      carrier_code: extra?.carrier_code,
      external_tracking_id: extra?.external_tracking_id,
      visible_to_customer: true,
    },
  });
}

async function syncParentOrderStatus(orderId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deleted_at: null },
    include: { sub_orders: { where: { deleted_at: null } } },
  });
  if (!order || order.sub_orders.length === 0) return;

  const statuses = order.sub_orders.map((s) => s.status);
  let next: OrderStatus | null = null;

  if (statuses.every((s) => s === 'delivered' || s === 'completed' || s === 'cancelled')) {
    if (statuses.some((s) => s === 'delivered' || s === 'completed')) {
      next = 'delivered';
    }
  } else if (statuses.some((s) => s === 'shipped')) {
    next = 'shipped';
  } else if (statuses.some((s) => s === 'processing' || s === 'confirmed')) {
    next = statuses.every((s) => s === 'confirmed' || s === 'pending') ? 'confirmed' : 'processing';
  }

  if (next && next !== order.status) {
    await prisma.order.update({ where: { id: orderId }, data: { status: next } });
  }
}

function assertTransition(current: SubOrderStatus, allowed: SubOrderStatus[]) {
  if (!allowed.includes(current)) {
    throw new AppError(
      400,
      `Cannot perform this action while sub-order status is "${current}"`,
      'INVALID_STATUS',
    );
  }
}

export async function confirmMerchantSubOrder(userId: number, subOrderId: number) {
  const { sub } = await getMerchantSubOrder(userId, subOrderId);
  assertTransition(sub.status, ['pending']);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.subOrder.update({
      where: { id: subOrderId },
      data: { status: 'confirmed' },
    });
    await createTrackingEvent(
      tx,
      sub.order_id,
      subOrderId,
      userId,
      'sub_order.confirmed',
      'Order confirmed',
      'Merchant confirmed your items are being prepared.',
    );
    if (sub.order.status === 'pending') {
      await tx.order.update({
        where: { id: sub.order_id },
        data: { status: 'confirmed' },
      });
    }
    return row;
  });

  await syncParentOrderStatus(sub.order_id);
  return updated;
}

export async function shipMerchantSubOrder(
  userId: number,
  subOrderId: number,
  body: ShipSubOrderBody,
) {
  const { sub } = await getMerchantSubOrder(userId, subOrderId);
  assertTransition(sub.status, ['confirmed', 'processing']);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.subOrder.update({
      where: { id: subOrderId },
      data: { status: 'shipped' },
    });
    await tx.orderTracking.create({
      data: {
        order_id: sub.order_id,
        sub_order_id: subOrderId,
        status: 'shipped',
        note: body.note ?? `Tracking: ${body.tracking_number}`,
      },
    });
    await createTrackingEvent(
      tx,
      sub.order_id,
      subOrderId,
      userId,
      'sub_order.shipped',
      'Order shipped',
      body.note ?? `Your package is on the way. Tracking: ${body.tracking_number}`,
      {
        carrier_code: body.carrier_code,
        external_tracking_id: body.tracking_number,
      },
    );
    return row;
  });

  await syncParentOrderStatus(sub.order_id);
  await queueOrderShippedEmail(sub.order_id, subOrderId, body.tracking_number);
  return updated;
}

export async function deliverMerchantSubOrder(userId: number, subOrderId: number) {
  const { sub } = await getMerchantSubOrder(userId, subOrderId);
  assertTransition(sub.status, ['shipped']);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.subOrder.update({
      where: { id: subOrderId },
      data: { status: 'delivered' },
    });
    await tx.orderTracking.create({
      data: {
        order_id: sub.order_id,
        sub_order_id: subOrderId,
        status: 'delivered',
        note: 'Delivered to customer',
      },
    });
    await createTrackingEvent(
      tx,
      sub.order_id,
      subOrderId,
      userId,
      'sub_order.delivered',
      'Order delivered',
      'Your order has been delivered. Payment: cash on delivery.',
    );
    if (sub.order.payment_method === 'cod' && sub.order.payment_status === 'unpaid') {
      await tx.order.update({
        where: { id: sub.order_id },
        data: { payment_status: 'paid' },
      });
    }
    return row;
  });

  await syncParentOrderStatus(sub.order_id);
  await ensureCommissionForSubOrder(subOrderId);
  await scheduleCommissionClearing(subOrderId);
  await queueOrderDeliveredEmail(sub.order_id, subOrderId);
  return updated;
}
