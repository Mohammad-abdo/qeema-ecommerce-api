import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { isMerchantRole, isStaffRole } from '../../lib/rbac.js';

import type { PaymentLogListQuery } from './payments.validators.js';

export async function listPaymentLogs(userId: number, role: string, q: PaymentLogListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.PaymentLogWhereInput = {};
  if (q.orderId) where.order_id = q.orderId;
  if (q.status) where.status = q.status;
  if (q.gateway) where.gateway = q.gateway;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }

  if (isStaffRole(role)) {
    const [items, total] = await Promise.all([
      prisma.paymentLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: q.limit,
      }),
      prisma.paymentLog.count({ where }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  if (isMerchantRole(role)) {
    const mid = await merchantIdForUser(userId);
    if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
    const orderRows = await prisma.order.findMany({
      where: { deleted_at: null, sub_orders: { some: { merchant_id: mid, deleted_at: null } } },
      select: { id: true },
    });
    const allowedIds = orderRows.map((o) => o.id);
    if (allowedIds.length === 0) {
      return { items: [], total: 0, page: q.page, limit: q.limit };
    }
    const scopedWhere: Prisma.PaymentLogWhereInput = {
      ...where,
      order_id: q.orderId
        ? allowedIds.includes(q.orderId)
          ? q.orderId
          : -1
        : { in: allowedIds },
    };
    const [items, total] = await Promise.all([
      prisma.paymentLog.findMany({
        where: scopedWhere,
        orderBy: { created_at: 'desc' },
        skip,
        take: q.limit,
      }),
      prisma.paymentLog.count({ where: scopedWhere }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  if (role === 'customer') {
    if (!q.orderId) {
      throw new AppError(400, 'orderId is required', 'BAD_REQUEST');
    }
    const order = await prisma.order.findFirst({ where: { id: q.orderId, deleted_at: null } });
    if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
    if (order.customer_id !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    const scopedWhere = { ...where, order_id: q.orderId };
    const [items, total] = await Promise.all([
      prisma.paymentLog.findMany({
        where: scopedWhere,
        orderBy: { created_at: 'desc' },
        skip,
        take: q.limit,
      }),
      prisma.paymentLog.count({ where: scopedWhere }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}
