import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { canManageUsers, isStaffRole } from '../../lib/rbac.js';

import type { CreateTicketBody, PatchTicketBody, TicketListQuery } from './support.validators.js';

export async function listTickets(userId: number, role: string, q: TicketListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.SupportTicketWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.priority) where.priority = q.priority;
  if (q.merchantId) where.merchant_id = q.merchantId;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }
  if (q.search) {
    where.OR = [
      { subject: { contains: q.search } },
      { ticket_number: { contains: q.search } },
      { description: { contains: q.search } },
    ];
  }

  if (isStaffRole(role)) {
    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: q.limit,
        include: { merchant: { select: { id: true, store_name: true } }, customer: { select: { id: true, email: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }
  if (role === 'merchant') {
    const mid = await merchantIdForUser(userId);
    const scopedWhere = { ...where, merchant_id: mid ?? -1 };
    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: scopedWhere,
        orderBy: { created_at: 'desc' },
        skip,
        take: q.limit,
      }),
      prisma.supportTicket.count({ where: scopedWhere }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }
  const scopedWhere = { ...where, customer_id: userId };
  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where: scopedWhere,
      orderBy: { created_at: 'desc' },
      skip,
      take: q.limit,
    }),
    prisma.supportTicket.count({ where: scopedWhere }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function createTicket(userId: number, role: string, body: CreateTicketBody) {
  const num = `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const merchantId =
    body.merchantId ?? (role === 'merchant' ? (await merchantIdForUser(userId)) ?? undefined : undefined);

  const customer_id = role === 'customer' ? userId : null;

  return prisma.supportTicket.create({
    data: {
      ticket_number: num,
      customer_id,
      merchant_id: merchantId ?? null,
      category: body.category,
      subject: body.subject,
      description: body.description,
      status: 'open',
      priority: 'medium',
    },
  });
}

export async function getTicketForUser(userId: number, role: string, ticketId: number) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId },
    include: {
      merchant: { select: { id: true, store_name: true } },
      customer: { select: { id: true, email: true, name: true } },
      messages: {
        orderBy: { created_at: 'asc' },
        include: { sender: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');

  if (isStaffRole(role)) return ticket;
  if (role === 'merchant') {
    const mid = await merchantIdForUser(userId);
    if (ticket.merchant_id !== mid) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    return ticket;
  }
  if (ticket.customer_id !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return ticket;
}

export async function addTicketMessage(userId: number, role: string, ticketId: number, message: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  const mid = await merchantIdForUser(userId);
  const isStaff = isStaffRole(role);
  const isCustomer = ticket.customer_id === userId;
  const isMerchant = ticket.merchant_id && ticket.merchant_id === mid;
  if (!isStaff && !isCustomer && !isMerchant) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  const senderType =
    role === 'admin' || role === 'super_admin'
      ? 'admin'
      : role === 'employee'
        ? 'employee'
        : role === 'merchant'
          ? 'merchant'
          : 'customer';

  return prisma.supportMessage.create({
    data: {
      ticket_id: ticketId,
      sender_id: userId,
      sender_type: senderType,
      message,
    },
  });
}

export async function patchTicket(userId: number, role: string, ticketId: number, body: PatchTicketBody) {
  if (!isStaffRole(role)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  if (body.assigned_to != null && body.assigned_to !== userId && !canManageUsers(role)) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.priority != null ? { priority: body.priority } : {}),
      ...(body.assigned_to !== undefined ? { assigned_to: body.assigned_to } : {}),
    },
  });
}
