import type { Prisma } from '@prisma/client';

function num(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

type OfferWithItems = Prisma.SpecialOfferGetPayload<{
  include: {
    merchant: { select: { id: true; store_name: true; store_slug: true; store_logo: true } };
    items: {
      include: {
        product: {
          select: {
            id: true;
            slug: true;
            name_en: true;
            name_ar: true;
            merchant_id: true;
            images: { take: 1; select: { image_url: true } };
            variants: {
              where: { deleted_at: null; is_active: true };
              orderBy: { price: 'asc' };
              take: 1;
              select: { id: true; price: true; compare_at_price: true; sku: true };
            };
          };
        };
        variant: { select: { id: true; price: true; compare_at_price: true; sku: true } };
      };
    };
  };
}>;

function lineUnitPrice(item: OfferWithItems['items'][0]): number {
  const v = item.variant ?? item.product.variants[0];
  return v ? num(v.price) : 0;
}

export function mapSpecialOfferRow(offer: OfferWithItems) {
  const items = offer.items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const unit = lineUnitPrice(item);
      const qty = item.quantity;
      const lineTotal = unit * qty;
      const v = item.variant ?? item.product.variants[0];
      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: v?.id ?? null,
        quantity: qty,
        sort_order: item.sort_order,
        slug: item.product.slug,
        name_en: item.product.name_en,
        name_ar: item.product.name_ar,
        image: item.product.images[0]?.image_url ?? null,
        unit_price: unit.toFixed(2),
        line_total: lineTotal.toFixed(2),
        sku: v?.sku ?? null,
      };
    });

  const originalTotal = items.reduce((sum, i) => sum + Number(i.line_total), 0);
  const bundlePrice = num(offer.bundle_price);
  const savings = Math.max(0, originalTotal - bundlePrice);
  const savingsPercent =
    originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

  return {
    id: offer.id,
    slug: offer.slug,
    title_en: offer.title_en,
    title_ar: offer.title_ar,
    description_en: offer.description_en,
    description_ar: offer.description_ar,
    image_url: offer.image_url,
    bundle_price: bundlePrice.toFixed(2),
    original_total: originalTotal.toFixed(2),
    savings_amount: savings.toFixed(2),
    savings_percent: savingsPercent,
    status: offer.status,
    is_featured: offer.is_featured,
    sort_order: offer.sort_order,
    starts_at: offer.starts_at?.toISOString() ?? null,
    ends_at: offer.ends_at?.toISOString() ?? null,
    merchant: offer.merchant
      ? {
          id: offer.merchant.id,
          store_name: offer.merchant.store_name,
          store_slug: offer.merchant.store_slug,
          store_logo: offer.merchant.store_logo,
        }
      : null,
    product_count: items.length,
    items,
  };
}

export const specialOfferInclude = {
  merchant: {
    select: { id: true, store_name: true, store_slug: true, store_logo: true },
  },
  items: {
    orderBy: { sort_order: 'asc' as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name_en: true,
          name_ar: true,
          merchant_id: true,
          images: {
            take: 1,
            orderBy: [{ is_primary: 'desc' as const }, { sort_order: 'asc' as const }],
            select: { image_url: true },
          },
          variants: {
            where: { deleted_at: null, is_active: true },
            orderBy: { price: 'asc' as const },
            take: 1,
            select: { id: true, price: true, compare_at_price: true, sku: true },
          },
        },
      },
      variant: { select: { id: true, price: true, compare_at_price: true, sku: true } },
    },
  },
} satisfies Prisma.SpecialOfferInclude;
