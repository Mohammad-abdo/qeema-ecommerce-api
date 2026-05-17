import type { Prisma } from '@prisma/client';

/** Published storefront product filter base */
export function publishedProductWhere(extra?: Prisma.ProductWhereInput): Prisma.ProductWhereInput {
  return {
    deleted_at: null,
    status: 'published',
    is_approved: true,
    ...extra,
  };
}

export const publicProductListSelect = {
  id: true,
  name_ar: true,
  name_en: true,
  slug: true,
  merchant_id: true,
  view_count: true,
  is_featured: true,
  status: true,
  is_approved: true,
  deleted_at: true,
  created_at: true,
  rating: true,
  rating_count: true,
  merchant: {
    select: { id: true, store_name: true, store_logo: true, store_slug: true },
  },
  category: { select: { id: true, slug: true, name_en: true, name_ar: true } },
  images: {
    take: 1,
    orderBy: [{ is_primary: 'desc' as const }, { sort_order: 'asc' as const }],
    select: { image_url: true, alt_text: true },
  },
  variants: {
    where: { deleted_at: null, is_active: true },
    orderBy: { price: 'asc' as const },
    take: 1,
    select: {
      id: true,
      sku: true,
      price: true,
      compare_at_price: true,
      stock_quantity: true,
    },
  },
  flash_sale_items: {
    where: {
      flash_sale: {
        is_active: true,
        starts_at: { lte: new Date() },
        ends_at: { gte: new Date() },
      },
    },
    take: 1,
    select: { id: true, discount_type: true, discount_value: true },
  },
} satisfies Prisma.ProductSelect;

export const publicProductDetailInclude = {
  merchant: { select: { id: true, store_name: true, store_slug: true, store_logo: true, rating: true, rating_count: true } },
  category: true,
  brand: true,
  variants: { where: { deleted_at: null, is_active: true }, orderBy: { price: 'asc' as const } },
  images: { orderBy: { sort_order: 'asc' as const } },
  flash_sale_items: {
    where: {
      flash_sale: {
        is_active: true,
        starts_at: { lte: new Date() },
        ends_at: { gte: new Date() },
      },
    },
    include: { flash_sale: true },
  },
  relations_from: {
    where: { relation_type: { in: ['related', 'upsell', 'cross_sell'] } },
    orderBy: { sort_order: 'asc' as const },
    take: 8,
    include: {
      related_product: { select: publicProductListSelect },
    },
  },
} satisfies Prisma.ProductInclude;

export function productListOrderBy(
  sort: 'newest' | 'views' | 'price_asc' | 'price_desc' | undefined,
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'views':
      return { view_count: 'desc' };
    case 'price_asc':
    case 'price_desc':
      return { created_at: 'desc' };
    case 'newest':
    default:
      return { created_at: 'desc' };
  }
}

export function sortProductsByPrice<T extends { variants: { price: unknown }[] }>(
  items: T[],
  sort: 'price_asc' | 'price_desc',
): T[] {
  return [...items].sort((a, b) => {
    const pa = Number(a.variants[0]?.price ?? 0);
    const pb = Number(b.variants[0]?.price ?? 0);
    return sort === 'price_asc' ? pa - pb : pb - pa;
  });
}
