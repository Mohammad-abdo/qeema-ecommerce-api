import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

export async function getAdminOrdersOverview() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    pending,
    confirmed,
    processing,
    shipped,
    delivered,
    cancelled,
    todayCount,
    recent,
    revenueToday,
    revenueTotal,
  ] = await Promise.all([
    prisma.order.count({ where: { deleted_at: null, status: 'pending' } }),
    prisma.order.count({ where: { deleted_at: null, status: 'confirmed' } }),
    prisma.order.count({ where: { deleted_at: null, status: 'processing' } }),
    prisma.order.count({ where: { deleted_at: null, status: 'shipped' } }),
    prisma.order.count({ where: { deleted_at: null, status: 'delivered' } }),
    prisma.order.count({ where: { deleted_at: null, status: 'cancelled' } }),
    prisma.order.count({ where: { deleted_at: null, created_at: { gte: startOfDay } } }),
    prisma.order.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        sub_orders: {
          where: { deleted_at: null },
          select: {
            id: true,
            status: true,
            merchant_id: true,
            total_amount: true,
            merchant: { select: { store_name: true } },
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: { deleted_at: null, created_at: { gte: startOfDay }, status: { not: 'cancelled' } },
      _sum: { total_amount: true },
    }),
    prisma.order.aggregate({
      where: { deleted_at: null, status: { notIn: ['cancelled'] } },
      _sum: { total_amount: true },
    }),
  ]);

  const commissionsPending = await prisma.commission.count({
    where: { status: { in: ['pending', 'clearing'] } },
  });

  return {
    stats: {
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      orders_today: todayCount,
      commissions_pending: commissionsPending,
      revenue_today: revenueToday._sum.total_amount?.toFixed(2) ?? '0.00',
      revenue_total: revenueTotal._sum.total_amount?.toFixed(2) ?? '0.00',
    },
    recent,
  };
}

export async function listAdminOrders(q: {
  page: number;
  limit: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
}) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.OrderWhereInput = { deleted_at: null };

  if (q.status) where.status = q.status as Prisma.EnumOrderStatusFilter['equals'];
  if (q.paymentStatus) {
    where.payment_status = q.paymentStatus as Prisma.EnumPaymentStatusFilter['equals'];
  }
  if (q.search?.trim()) {
    const term = q.search.trim();
    const idNum = Number(term.replace(/^#/, ''));
    where.OR = [
      ...(Number.isFinite(idNum) ? [{ id: idNum }] : []),
      { order_number: { contains: term } },
      { customer: { email: { contains: term } } },
      { customer: { name: { contains: term } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: q.limit,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        sub_orders: {
          where: { deleted_at: null },
          select: {
            id: true,
            status: true,
            merchant_id: true,
            total_amount: true,
            commission_amount: true,
            merchant: { select: { id: true, store_name: true } },
            commissions: { select: { id: true, status: true, amount: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: q.page, limit: q.limit };
}
