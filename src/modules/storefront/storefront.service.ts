import { prisma } from '../../lib/prisma.js';
import { publicProductListSelect, publishedProductWhere } from '../catalog/catalog.public.js';
import { mapCategoryToHomeCategory, mapProductToLegacyApi } from './storefront.mappers.js';

const now = () => new Date();

export async function getStorefrontHome() {
  const productWhere = publishedProductWhere();

  const [
    stories,
    sliderCampaigns,
    categories,
    adminProductsRaw,
    hotDealsRaw,
    latestProductsRaw,
    topStores,
  ] = await Promise.all([
    prisma.storefrontStory.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        items: { where: { is_active: true }, orderBy: { sort_order: 'asc' } },
      },
    }),
    prisma.adCampaign.findMany({
      where: {
        type: 'homepage_banner',
        status: 'active',
        starts_at: { lte: now() },
        ends_at: { gte: now() },
      },
      include: {
        items: {
          where: { banner_image: { not: null } },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
      take: 10,
    }),
    prisma.category.findMany({
      where: { deleted_at: null, is_active: true, parent_id: null },
      orderBy: [{ sort_order: 'asc' }, { name_en: 'asc' }],
      take: 12,
      select: { id: true, name_en: true, name_ar: true, slug: true, image: true, parent_id: true },
    }),
    prisma.product.findMany({
      where: productWhere,
      orderBy: { created_at: 'desc' },
      take: 60,
      select: publicProductListSelect,
    }),
    prisma.product.findMany({
      where: productWhere,
      orderBy: { view_count: 'desc' },
      take: 8,
      select: publicProductListSelect,
    }),
    prisma.product.findMany({
      where: productWhere,
      orderBy: { created_at: 'desc' },
      take: 8,
      select: publicProductListSelect,
    }),
    prisma.merchant.findMany({
      where: {
        deleted_at: null,
        status: 'approved',
        is_featured: true,
      },
      orderBy: { rating: 'desc' },
      take: 6,
      select: {
        id: true,
        store_name: true,
        store_logo: true,
        store_banner: true,
        store_description: true,
        rating: true,
        rating_count: true,
        total_orders: true,
      },
    }),
  ]);

  const isBannerPlacement = (targeting: unknown) => {
    if (!targeting || typeof targeting !== 'object') return true;
    const p = (targeting as { placement?: string }).placement;
    return p == null || p === 'banner';
  };

  const sliders = sliderCampaigns
    .filter((c) => isBannerPlacement(c.targeting))
    .flatMap((c, ci) => {
      const meta =
        c.targeting && typeof c.targeting === 'object'
          ? (c.targeting as {
              title?: string;
              description?: string;
              tags?: string[];
            })
          : {};
      return c.items
        .filter((item) => item.banner_image && (item.banner_position === 'hero' || item.banner_position == null))
        .map((item, ii) => ({
          _id: String(item.id),
          title: meta.title?.trim() || 'Promo',
          description: meta.description?.trim() || '',
          tags: Array.isArray(meta.tags) ? meta.tags : [],
          image: item.banner_image!,
          href: item.banner_link ?? '/products',
          linkType: item.product_id != null ? 'product' : 'external',
          linkId: item.product_id != null ? String(item.product_id) : undefined,
          order: ci * 10 + ii,
          isActive: c.status === 'active',
          createdAt: item.created_at.toISOString(),
          updatedAt: item.updated_at.toISOString(),
        }));
    })
    .filter((s) => s.isActive)
    .sort((a, b) => a.order - b.order);

  const apiStories = stories.map((s) => ({
    _id: String(s.id),
    vendorId: s.merchant_id != null ? String(s.merchant_id) : String(s.id),
    vendorName: s.vendor_name,
    vendorNameTr: s.vendor_name_tr ?? s.vendor_name,
    vendorNameAr: s.vendor_name_ar ?? s.vendor_name,
    isActive: s.is_active,
    isAdmin: s.is_admin,
    linkType: s.link_type,
    stories: s.items.map((item) => ({
      _id: String(item.id),
      thumbnail: item.thumbnail ?? item.media_url,
      media: [
        {
          type: item.media_type,
          url: item.media_url,
          duration: item.duration,
          linkType: item.link_type,
          linkId: item.link_id ?? undefined,
          _id: String(item.id),
        },
      ],
      duration: item.duration,
      linkType: item.link_type,
      order: item.sort_order,
      isActive: item.is_active,
      expiresAt: null,
      views: [],
      viewCount: 0,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    })),
    media: s.items[0]
      ? [
          {
            type: s.items[0].media_type,
            url: s.items[0].media_url,
            duration: s.items[0].duration,
            linkType: s.items[0].link_type,
            linkId: s.items[0].link_id ?? undefined,
            _id: String(s.items[0].id),
          },
        ]
      : [],
    duration: s.items[0]?.duration ?? 5,
    order: s.sort_order,
  }));

  const adminProducts = adminProductsRaw.map(mapProductToLegacyApi);
  const hotDeals = hotDealsRaw.map(mapProductToLegacyApi);
  const latestProducts = latestProductsRaw.map(mapProductToLegacyApi);

  return {
    stories: apiStories,
    sliders,
    categories: categories.map(mapCategoryToHomeCategory),
    adminProducts,
    hotDeals,
    latestProducts,
    topStores: topStores.map((m) => ({
      _id: String(m.id),
      storeName: m.store_name,
      logo: m.store_logo ?? undefined,
      banner: m.store_banner ?? undefined,
      description: m.store_description ?? undefined,
      subscriptionPlan: null,
      hasPremiumBadge: true,
      stats: {
        rating: Number(m.rating),
        totalOrders: m.total_orders,
        totalReviews: m.rating_count,
      },
    })),
    realEstate: [] as ReturnType<typeof mapProductToLegacyApi>[],
  };
}
