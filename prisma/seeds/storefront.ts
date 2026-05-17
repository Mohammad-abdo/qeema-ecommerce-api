import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import { reelClipAt } from './seed-media.ts';
import type { CatalogSeedItem, SeedCatalog, SeedMerchants } from './types.ts';

function groupByMerchant(items: CatalogSeedItem[]): Map<number, CatalogSeedItem[]> {
  const map = new Map<number, CatalogSeedItem[]>();
  for (const item of items) {
    const list = map.get(item.merchantId) ?? [];
    list.push(item);
    map.set(item.merchantId, list);
  }
  return map;
}

export async function seedStorefront(
  prisma: PrismaClient,
  merchants: SeedMerchants,
  catalog: SeedCatalog,
) {
  const starts = new Date();
  const ends = new Date(starts.getTime() + 90 * 24 * 60 * 60 * 1000);
  const byMerchant = groupByMerchant(catalog.catalogItems);

  const bannerCampaign = await prisma.adCampaign.create({
    data: {
      merchant_id: merchants.merchantId,
      type: 'homepage_banner',
      status: 'active',
      bidding_type: 'fixed',
      budget: 1000,
      starts_at: starts,
      ends_at: ends,
      targeting: {
        placement: 'banner',
        title: 'Summer Sale',
        description: 'Up to 40% off across top stores',
        tags: ['sale', 'featured'],
      },
    },
  });

  await prisma.adCampaignItem.create({
    data: {
      campaign_id: bannerCampaign.id,
      item_type: 'banner',
      banner_image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      banner_link: '/products',
      banner_position: 'hero',
    },
  });

  let reelIndex = 0;
  let sortOrder = 0;

  for (const merchant of merchants.merchants) {
    const products = byMerchant.get(merchant.id) ?? [];
    if (products.length === 0) continue;

    const storyItems = products.flatMap((p, pi) => {
      const clips: Array<{
        media_url: string;
        thumbnail: string;
        link_type: string;
        link_id: string;
        sort_order: number;
        duration: number;
      }> = [
        {
          media_url: reelClipAt(reelIndex),
          thumbnail: p.imageUrl,
          link_type: 'product',
          link_id: p.slug,
          sort_order: pi * 2,
          duration: 5,
        },
      ];
      reelIndex += 1;
      if (pi % 2 === 0) {
        clips.push({
          media_url: p.imageUrl.replace('w=800', 'w=600&h=900&fit=crop'),
          thumbnail: p.imageUrl,
          link_type: 'product',
          link_id: p.slug,
          sort_order: pi * 2 + 1,
          duration: 6,
        });
        reelIndex += 1;
      }
      return clips;
    });

    await prisma.storefrontStory.create({
      data: {
        vendor_name: merchant.store_name,
        vendor_name_tr: merchant.store_name,
        vendor_name_ar: merchant.store_name_ar,
        merchant_id: merchant.id,
        is_active: true,
        is_admin: false,
        link_type: 'store',
        sort_order: sortOrder++,
        items: {
          create: storyItems.slice(0, 5),
        },
      },
    });
  }

  const adminReelSets: Array<{ name: string; name_ar: string; clipStart: number }> = [
    { name: 'Esyasatgo Deals', name_ar: 'عروض إسياسات جو', clipStart: 0 },
    { name: 'New Arrivals', name_ar: 'وصل حديثاً', clipStart: 5 },
    { name: 'Flash Picks', name_ar: 'اختيارات سريعة', clipStart: 10 },
    { name: 'Weekend Offers', name_ar: 'عروض نهاية الأسبوع', clipStart: 15 },
  ];

  for (const promo of adminReelSets) {
    const items = Array.from({ length: 4 }, (_, i) => {
      const clip = reelClipAt(promo.clipStart + i);
      const product = catalog.catalogItems[(promo.clipStart + i) % catalog.catalogItems.length]!;
      return {
        media_url: clip,
        thumbnail: product?.imageUrl ?? clip,
        media_type: 'image' as const,
        duration: 5 + (i % 2),
        link_type: 'product',
        link_id: product?.slug,
        sort_order: i,
        is_active: true,
      };
    });

    await prisma.storefrontStory.create({
      data: {
        vendor_name: promo.name,
        vendor_name_tr: promo.name,
        vendor_name_ar: promo.name_ar,
        merchant_id: null,
        is_active: true,
        is_admin: true,
        link_type: 'product',
        sort_order: sortOrder++,
        items: { create: items },
      },
    });
    reelIndex += 4;
  }

  const featuredMerchants = merchants.merchants.filter((_, i) => i < 4);
  for (let i = 0; i < featuredMerchants.length; i++) {
    const m = featuredMerchants[i]!;
    const heroProduct = byMerchant.get(m.id)?.[0];
    await prisma.adCampaign.create({
      data: {
        merchant_id: m.id,
        type: 'homepage_banner',
        status: 'active',
        bidding_type: 'fixed',
        budget: new Prisma.Decimal(500),
        starts_at: starts,
        ends_at: ends,
        targeting: {
          placement: 'banner',
          title: m.store_name,
          description: `Shop ${m.store_name} today`,
          tags: ['store', 'featured'],
        },
        items: {
          create: {
            item_type: 'banner',
            product_id: heroProduct?.productId ?? null,
            banner_image:
              heroProduct?.imageUrl ??
              'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
            banner_link: heroProduct ? `/listing/${heroProduct.slug}` : '/products',
            banner_position: 'hero',
          },
        },
      },
    });
  }
}
