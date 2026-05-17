import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { SeedCatalog, SeedMerchants, SeedUsers } from './types.ts';

export async function seedMarketing(
  prisma: PrismaClient,
  merchants: SeedMerchants,
  catalog: SeedCatalog,
  users: SeedUsers,
) {
  const starts = new Date();
  const ends = new Date(starts.getTime() + 7 * 24 * 60 * 60 * 1000);

  const flash = await prisma.flashSale.create({
    data: {
      name: 'Seed Weekend Sale',
      starts_at: starts,
      ends_at: ends,
      is_active: true,
    },
  });

  await prisma.flashSaleItem.create({
    data: {
      flash_sale_id: flash.id,
      product_id: catalog.productId,
      variant_id: catalog.variantId,
      discount_type: 'percentage',
      discount_value: new Prisma.Decimal(15),
      max_qty: 50,
    },
  });

  const campaign = await prisma.adCampaign.create({
    data: {
      merchant_id: merchants.merchantId,
      type: 'sponsored_product',
      status: 'active',
      bidding_type: 'cpc',
      budget: new Prisma.Decimal(5000),
      bid_amount: new Prisma.Decimal(2.5),
      starts_at: starts,
      ends_at: ends,
    },
  });

  const item = await prisma.adCampaignItem.create({
    data: {
      campaign_id: campaign.id,
      item_type: 'product',
      product_id: catalog.productId,
    },
  });

  await prisma.adAnalytic.create({
    data: {
      campaign_id: campaign.id,
      campaign_item_id: item.id,
      date: new Date('2025-01-10'),
      impressions: 1000,
      clicks: 42,
      spend: new Prisma.Decimal(120),
    },
  });

  await prisma.adPayment.create({
    data: {
      campaign_id: campaign.id,
      amount: new Prisma.Decimal(500),
      method: 'wallet',
      status: 'success',
      paid_at: new Date(),
    },
  });

  const market = await prisma.market.create({
    data: {
      name: 'Egypt',
      slug: 'egypt',
      country: 'EG',
      currency: 'EGP',
    },
  });

  await prisma.marketMerchant.create({
    data: {
      market_id: market.id,
      merchant_id: merchants.merchantId,
    },
  });

  const merchantProducts = catalog.catalogItems.filter((p) => p.merchantId === merchants.merchantId);
  if (merchantProducts.length >= 3) {
    const trio = merchantProducts.slice(0, 3);
    const original = trio.reduce((s, p) => s + Number(p.unitPrice), 0);
    const bundlePrice = Math.round(original * 0.75 * 100) / 100;

    await prisma.specialOffer.create({
      data: {
        merchant_id: merchants.merchantId,
        created_by: users.adminId,
        title_en: 'Starter Tech Bundle',
        title_ar: 'باقة تقنية مميزة',
        slug: 'starter-tech-bundle',
        description_en: 'Three essentials at one special price — headphones, hub, and keyboard.',
        description_ar: 'ثلاثة منتجات أساسية بسعر واحد مميز.',
        image_url: trio[0]!.imageUrl,
        bundle_price: new Prisma.Decimal(bundlePrice),
        status: 'active',
        is_featured: true,
        sort_order: 0,
        starts_at: starts,
        ends_at: ends,
        items: {
          create: trio.map((p, idx) => ({
            product_id: p.productId,
            variant_id: p.variantId,
            quantity: 1,
            sort_order: idx,
          })),
        },
      },
    });

    const pair = merchantProducts.slice(3, 5);
    if (pair.length >= 2) {
      const pairTotal = pair.reduce((s, p) => s + Number(p.unitPrice), 0);
      await prisma.specialOffer.create({
        data: {
          merchant_id: merchants.merchantId,
          created_by: users.merchantUserId,
          title_en: 'Fashion Duo Deal',
          title_ar: 'عرض ثنائي للأزياء',
          slug: 'fashion-duo-deal',
          description_en: 'Pick this pair and save instantly.',
          description_ar: 'اختَر الثنائي ووفّر فوراً.',
          image_url: pair[0]!.imageUrl,
          bundle_price: new Prisma.Decimal(Math.round(pairTotal * 0.8 * 100) / 100),
          status: 'active',
          is_featured: false,
          sort_order: 1,
          starts_at: starts,
          ends_at: ends,
          items: {
            create: pair.map((p, idx) => ({
              product_id: p.productId,
              variant_id: p.variantId,
              quantity: 1,
              sort_order: idx,
            })),
          },
        },
      });
    }
  }
}
