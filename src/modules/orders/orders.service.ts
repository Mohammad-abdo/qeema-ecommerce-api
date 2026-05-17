import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { isMerchantRole, isStaffRole } from '../../lib/rbac.js';

import type {
  CreateTrackingEventBody,
  OrderListUserQuery,
  PatchOrderBody,
  PatchSubOrderBody,
} from './orders.validators.js';

export async function listOrdersForUser(userId: number, role: string, q: OrderListUserQuery) {
  const skip = (q.page - 1) * q.limit;

  const commonFilters: Prisma.OrderWhereInput = {
    deleted_at: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.from || q.to
      ? {
          created_at: {
            ...(q.from ? { gte: q.from } : {}),
            ...(q.to ? { lte: q.to } : {}),
          },
        }
      : {}),
  };

  let where: Prisma.OrderWhereInput;

  if (isStaffRole(role)) {
    where = { ...commonFilters };
    if (q.merchantId) {
      where.sub_orders = { some: { merchant_id: q.merchantId, deleted_at: null } };
    }
  } else if (isMerchantRole(role)) {
    const mid = await merchantIdForUser(userId);
    if (q.merchantId && mid && q.merchantId !== mid) {
      where = { ...commonFilters, id: -1 };
    } else {
      where = {
        ...commonFilters,
        sub_orders: { some: { merchant_id: mid ?? -1, deleted_at: null } },
      };
    }
  } else if (role === 'customer') {
    where = { ...commonFilters, customer_id: userId };
  } else {
    where = { ...commonFilters, id: -1 };
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: q.limit,
      include: {
        ...(isStaffRole(role)
          ? { customer: { select: { id: true, name: true, email: true } } }
          : {}),
        sub_orders: {
          where: { deleted_at: null },
          select: {
            id: true,
            merchant_id: true,
            status: true,
            total_amount: true,
            commission_amount: true,
            ...(isStaffRole(role)
              ? { merchant: { select: { id: true, store_name: true } } }
              : {}),
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function getOrderForUser(userId: number, role: string, orderId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deleted_at: null },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      sub_orders: {
        include: {
          items: true,
          merchant: { select: { id: true, store_name: true } },
          commissions: { select: { id: true, status: true, amount: true, gross_amount: true, cleared_at: true } },
        },
      },
      shipping_address: true,
      tracking_events: { orderBy: { occurred_at: 'desc' }, take: 50 },
      invoices: true,
    },
  });
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');

  if (isStaffRole(role)) return order;
  if (order.customer_id === userId && role === 'customer') return order;
  if (isMerchantRole(role)) {
    const mid = await merchantIdForUser(userId);
    if (mid && order.sub_orders.some((s) => s.merchant_id === mid)) return order;
  }
  throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}

function trackingActorType(role: string): 'merchant' | 'admin' | 'support' {
  if (role === 'merchant') return 'merchant';
  if (role === 'employee') return 'support';
  return 'admin';
}

export async function addOrderTrackingEvent(
  userId: number,
  role: string,
  orderId: number,
  body: CreateTrackingEventBody,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deleted_at: null },
    include: { sub_orders: true },
  });
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');

  if (isStaffRole(role)) {
    // ok
  } else if (isMerchantRole(role)) {
    const mid = await merchantIdForUser(userId);
    if (!mid || !order.sub_orders.some((s) => s.merchant_id === mid)) {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    }
  } else {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }

  if (body.subOrderId != null) {
    const sub = order.sub_orders.find((s) => s.id === body.subOrderId);
    if (!sub) throw new AppError(400, 'Invalid subOrderId', 'BAD_REQUEST');
  }

  const actorType = trackingActorType(role);

  return prisma.orderTrackingEvent.create({
    data: {
      order_id: orderId,
      sub_order_id: body.subOrderId ?? null,
      actor_type: actorType,
      actor_user_id: userId,
      event_code: body.eventCode,
      title: body.title,
      description: body.description,
      visible_to_customer: body.visibleToCustomer,
    },
  });
}

export async function patchOrderForUser(userId: number, role: string, orderId: number, body: PatchOrderBody) {
  if (!isStaffRole(role)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  const order = await prisma.order.findFirst({ where: { id: orderId, deleted_at: null } });
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  return prisma.order.update({
    where: { id: orderId },
    data: {
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.paymentStatus != null ? { payment_status: body.paymentStatus } : {}),
    },
  });
}

export async function patchSubOrderForUser(
  userId: number,
  role: string,
  orderId: number,
  subOrderId: number,
  body: PatchSubOrderBody,
) {
  const sub = await prisma.subOrder.findFirst({
    where: { id: subOrderId, order_id: orderId, deleted_at: null },
    include: { order: true },
  });
  if (!sub) throw new AppError(404, 'Sub-order not found', 'NOT_FOUND');

  if (isStaffRole(role)) {
    // ok
  } else if (isMerchantRole(role)) {
    const mid = await merchantIdForUser(userId);
    if (!mid || sub.merchant_id !== mid) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  } else {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }

  return prisma.subOrder.update({
    where: { id: subOrderId },
    data: { status: body.status },
  });
}

export async function cancelOrderForCustomer(userId: number, orderId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customer_id: userId, deleted_at: null },
  });
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError(400, 'Order cannot be cancelled in its current status', 'INVALID_STATUS');
  }
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'cancelled' },
  });
}
