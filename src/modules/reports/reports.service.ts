import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { isStaffRole } from '../../lib/rbac.js';

import type { CreateReportRunBody, ReportRunListQuery } from './reports.validators.js';

export async function listReportDefinitions(userId: number, role: string) {
  if (isStaffRole(role)) {
    return prisma.reportDefinition.findMany({
      where: { is_active: true },
      take: 100,
      orderBy: { id: 'desc' },
    });
  }
  const mid = await merchantIdForUser(userId);
  if (!mid) return [];
  return prisma.reportDefinition.findMany({
    where: {
      is_active: true,
      OR: [{ merchant_id: mid }, { owner_user_id: userId }],
    },
    take: 100,
    orderBy: { id: 'desc' },
  });
}

export async function createReportRun(userId: number, role: string, body: CreateReportRunBody) {
  const mid = role === 'merchant' ? await merchantIdForUser(userId) : null;
  return prisma.reportRun.create({
    data: {
      report_definition_id: body.reportDefinitionId ?? null,
      merchant_id: mid,
      requested_by_user_id: userId,
      status: 'pending',
      parameters: (body.parameters ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listReportRuns(userId: number, role: string, q: ReportRunListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.ReportRunWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.merchantId) where.merchant_id = q.merchantId;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }

  if (isStaffRole(role)) {
    const [items, total] = await Promise.all([
      prisma.reportRun.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: q.limit,
        include: { definition: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.reportRun.count({ where }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  if (role === 'merchant') {
    const mid = await merchantIdForUser(userId);
    const scopedWhere: Prisma.ReportRunWhereInput = {
      ...where,
      OR: [{ merchant_id: mid ?? -1 }, { requested_by_user_id: userId }],
    };
    const [items, total] = await Promise.all([
      prisma.reportRun.findMany({
        where: scopedWhere,
        orderBy: { id: 'desc' },
        skip,
        take: q.limit,
        include: { definition: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.reportRun.count({ where: scopedWhere }),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  const scopedWhere = { ...where, requested_by_user_id: userId };
  const [items, total] = await Promise.all([
    prisma.reportRun.findMany({
      where: scopedWhere,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
      include: { definition: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.reportRun.count({ where: scopedWhere }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}
