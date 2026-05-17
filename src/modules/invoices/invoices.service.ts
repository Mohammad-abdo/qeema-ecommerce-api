import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { isStaffRole } from '../../lib/rbac.js';

import type { ArchiveInvoiceBody, InvoiceListQuery } from './invoices.validators.js';

export async function listInvoices(userId: number, role: string, q: InvoiceListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.InvoiceWhereInput = {};
  if (q.orderId) where.order_id = q.orderId;
  if (q.status) where.status = q.status;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }
  if (q.search) {
    where.OR = [
      { invoice_number: { contains: q.search } },
      { order: { order_number: { contains: q.search } } },
    ];
  }

  if (isStaffRole(role)) {
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: q.limit,
        include: { order: { select: { id: true, order_number: true, customer_id: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  if (role === 'merchant') {
    const mid = await merchantIdForUser(userId);
    const orderFilter: Prisma.OrderWhereInput = {
      deleted_at: null,
      sub_orders: { some: { merchant_id: mid ?? -1, deleted_at: null } },
    };
    const scopedWhere = { ...where, order: orderFilter };
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where: scopedWhere,
        orderBy: { id: 'desc' },
        skip,
        take: q.limit,
        include: { order: { select: { id: true, order_number: true, customer_id: true } } },
      }),
      prisma.invoice.count({ where: scopedWhere }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  if (role === 'customer') {
    const scopedWhere = { ...where, order: { customer_id: userId, deleted_at: null } };
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where: scopedWhere,
        orderBy: { id: 'desc' },
        skip,
        take: q.limit,
        include: { order: { select: { id: true, order_number: true } } },
      }),
      prisma.invoice.count({ where: scopedWhere }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}

export async function archiveInvoice(adminId: number, invoiceId: number, body: ArchiveInvoiceBody) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      archived_at: new Date(),
      archived_by_user_id: adminId,
      archive_uri: body.archiveUri,
      archive_tier: body.archiveTier,
      archive_fingerprint: body.archiveFingerprint ?? null,
    },
  });
}
