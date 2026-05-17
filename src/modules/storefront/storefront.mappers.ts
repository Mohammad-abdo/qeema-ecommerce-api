import type { Prisma } from '@prisma/client';

import { publicProductListSelect } from '../catalog/catalog.public.js';

type ListProduct = Prisma.ProductGetPayload<{ select: typeof publicProductListSelect }>;

function dec(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

function primaryImage(p: ListProduct): string {
  const url = p.images[0]?.image_url;
  return url ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
}

function variantPrice(p: ListProduct) {
  const v0 = p.variants[0];
  const price = v0 ? dec(v0.price) : 0;
  const compareAt = v0?.compare_at_price != null ? dec(v0.compare_at_price) : undefined;
  return { v0, price, compareAt };
}

export function mapProductToLegacyApi(p: ListProduct) {
  const { v0, price, compareAt } = variantPrice(p);
  const hasFlash = p.flash_sale_items.length > 0;
  const hasDeal = compareAt != null && compareAt > price;
  return {
    productId: p.id,
    _id: p.slug,
    title: p.name_en,
    titleTr: p.name_en,
    titleAr: p.name_ar,
    description: '',
    descriptionTr: '',
    descriptionAr: '',
    price,
    compareAtPrice: hasDeal ? compareAt : undefined,
    images: [primaryImage(p)],
    sku: v0?.sku ?? String(p.id),
    slug: p.slug,
    rating: { average: dec(p.rating), count: p.rating_count },
    isFeaturedDeal: p.is_featured || hasDeal,
    isFlashDeal: hasFlash || hasDeal,
    deliveryInfo: {
      freeShipping: false,
      estimatedDays: 3,
      isInTurkey: false,
      allowCashOnDelivery: true,
    },
    vendorId: {
      _id: String(p.merchant_id),
      storeName: p.merchant?.store_name ?? 'Store',
      logo: p.merchant?.store_logo ?? undefined,
      stats: { rating: dec(p.merchant?.store_slug ? 0 : 0), totalReviews: 0 },
    },
    location: { city: 'Egypt', formattedAddress: 'Egypt' },
    views: p.view_count,
    condition: 'new',
    status: 'published',
    productType: 'simple',
    stock: v0?.stock_quantity ?? 0,
    createdAt: p.created_at.toISOString(),
    variantId: v0?.id,
  };
}

export function mapCategoryToHomeCategory(c: {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  image: string | null;
  parent_id: number | null;
}) {
  return {
    _id: String(c.id),
    name: c.name_en,
    nameTr: c.name_en,
    nameAr: c.name_ar,
    slug: c.slug,
    image: c.image,
    level: c.parent_id == null ? 0 : 1,
  };
}
