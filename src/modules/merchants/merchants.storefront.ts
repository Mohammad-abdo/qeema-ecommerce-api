import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { publishedProductWhere, publicProductListSelect } from '../catalog/catalog.public.js';

function num(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

function mapProductRow(p: {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  is_featured: boolean;
  view_count: number;
  rating: unknown;
  rating_count: number;
  images: Array<{ image_url: string }>;
  variants: Array<{ id: number; price: unknown; compare_at_price: unknown | null; sku: string }>;
  flash_sale_items: Array<unknown>;
}) {
  const v0 = p.variants[0];
  const price = v0 ? num(v0.price) : 0;
  const compareAt = v0?.compare_at_price != null ? num(v0.compare_at_price) : null;
  const hasFlash = p.flash_sale_items.length > 0;
  const onSale = compareAt != null && compareAt > price;
  const discountPct =
    onSale && compareAt && compareAt > 0
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : null;

  return {
    id: p.id,
    slug: p.slug,
    name_en: p.name_en,
    name_ar: p.name_ar,
    image: p.images[0]?.image_url ?? null,
    price: price.toFixed(2),
    compare_at_price: onSale ? compareAt!.toFixed(2) : null,
    discount_percent: discountPct,
    is_featured: p.is_featured,
    is_deal: onSale || hasFlash,
    is_flash: hasFlash,
    variant_id: v0?.id ?? null,
    sku: v0?.sku ?? null,
    views: p.view_count,
    rating: num(p.rating),
    rating_count: p.rating_count,
  };
}

export async function getMerchantStorefrontProfile(slug: string) {
  const merchant = await prisma.merchant.findFirst({
    where: { store_slug: slug, deleted_at: null, status: 'approved' },
    include: {
      user: { select: { id: true, name: true } },
      settings: true,
    },
  });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');

  const products = await prisma.product.findMany({
    where: publishedProductWhere({ merchant_id: merchant.id }),
    orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
    take: 120,
    select: publicProductListSelect,
  });

  const mapped = products.map(mapProductRow);
  const deals = mapped.filter((p) => p.is_deal);
  const featured = mapped.filter((p) => p.is_featured);
  const catalog = mapped;

  const settings = merchant.settings;
  const social =
    settings?.social_links && typeof settings.social_links === 'object'
      ? (settings.social_links as Record<string, string | null>)
      : {};

  return {
    store: {
      id: merchant.id,
      store_name: merchant.store_name,
      store_slug: merchant.store_slug,
      store_description: merchant.store_description,
      store_logo: merchant.store_logo,
      store_banner: merchant.store_banner,
      rating: num(merchant.rating),
      rating_count: merchant.rating_count,
      total_orders: merchant.total_orders,
      is_featured: merchant.is_featured,
      owner_name: merchant.user.name,
    },
    contact: {
      phone: settings?.contact_phone ?? null,
      whatsapp: settings?.contact_whatsapp ?? null,
      email: settings?.contact_email ?? null,
      address: settings?.contact_address ?? null,
      social: {
        website: social.website ?? null,
        instagram: social.instagram ?? null,
        facebook: social.facebook ?? null,
        twitter: social.twitter ?? null,
        tiktok: social.tiktok ?? null,
      },
    },
    policies: {
      return_policy: settings?.return_policy ?? null,
      shipping_policy: settings?.shipping_policy ?? null,
      privacy_policy: settings?.privacy_policy ?? null,
      terms_policy: settings?.terms_policy ?? null,
    },
    stats: {
      product_count: catalog.length,
      deal_count: deals.length,
      featured_count: featured.length,
    },
    featured,
    deals,
    products: catalog,
  };
}
