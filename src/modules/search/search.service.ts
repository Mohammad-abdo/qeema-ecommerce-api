import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

import type { AdminSearchIndexListQuery, SearchQuery } from './search.validators.js';

export async function searchProducts(q: SearchQuery) {
  const term = q.q.trim();
  return prisma.searchIndex.findMany({
    where: {
      deleted_at: null,
      OR: [
        { title_en: { contains: term } },
        { title_ar: { contains: term } },
        { search_blob: { contains: term } },
        { sku: { contains: term } },
      ],
    },
    take: q.limit,
    orderBy: { popularity_score: 'desc' },
  });
}

export async function listSearchIndexAdmin(q: AdminSearchIndexListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.SearchIndexWhereInput = { deleted_at: null };
  if (q.merchantId) where.merchant_id = q.merchantId;
  if (q.entityType) where.entity_type = q.entityType;
  if (q.search) {
    where.OR = [
      { title_en: { contains: q.search } },
      { title_ar: { contains: q.search } },
      { sku: { contains: q.search } },
      { product_slug: { contains: q.search } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.searchIndex.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
    }),
    prisma.searchIndex.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}
