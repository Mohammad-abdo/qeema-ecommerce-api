import { prisma } from '../../lib/prisma.js';

const productSelect = {
  id: true,
  entity_type: true,
  entity_int_id: true,
  title_en: true,
  title_ar: true,
  sku: true,
  product_slug: true,
  primary_image_url: true,
  merchant_store_name: true,
} as const;

export async function adminUnifiedSearch(q: string, limit: number) {
  const term = q.trim();
  if (!term) {
    return { products: [], users: [], orders: [], merchants: [] };
  }

  const numId = /^\d+$/.test(term) ? Number.parseInt(term, 10) : null;

  const [products, users, orders, merchants] = await Promise.all([
    prisma.searchIndex.findMany({
      where: {
        deleted_at: null,
        OR: [
          { title_en: { contains: term } },
          { title_ar: { contains: term } },
          { search_blob: { contains: term } },
          { sku: { contains: term } },
          { barcode: { contains: term } },
          { product_slug: { contains: term } },
          ...(numId != null ? [{ entity_int_id: numId }] : []),
        ],
      },
      take: limit,
      orderBy: { popularity_score: 'desc' },
      select: productSelect,
    }),
    prisma.user.findMany({
      where: {
        deleted_at: null,
        OR: [
          { email: { contains: term } },
          { name: { contains: term } },
          { phone: { contains: term } },
          ...(numId != null ? [{ id: numId }] : []),
        ],
      },
      take: limit,
      orderBy: { id: 'desc' },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { order_number: { contains: term } },
          ...(numId != null ? [{ id: numId }] : []),
        ],
      },
      take: limit,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        order_number: true,
        status: true,
        total_amount: true,
        created_at: true,
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.merchant.findMany({
      where: {
        deleted_at: null,
        OR: [
          { store_name: { contains: term } },
          { store_slug: { contains: term } },
          ...(numId != null ? [{ id: numId }] : []),
        ],
      },
      take: limit,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        store_name: true,
        store_slug: true,
        store_logo: true,
        status: true,
      },
    }),
  ]);

  return { products, users, orders, merchants };
}
