import type { PrismaClient } from '@prisma/client';

import type { SeedCatalog, SeedMerchants } from './types.ts';

export async function seedSearch(prisma: PrismaClient, _merchants: SeedMerchants, catalog: SeedCatalog) {
  const merchantById = new Map(
    _merchants.merchants.map((m) => [m.id, { slug: m.store_slug, name: m.store_name }]),
  );

  await prisma.searchIndex.createMany({
    data: catalog.catalogItems.map((item, idx) => {
      const merchant = merchantById.get(item.merchantId);
      const merchantSlug = merchant?.slug ?? 'demo-electronics';
      const storeName = merchant?.name ?? 'Demo Electronics';
      return {
        entity_type: 'product',
        entity_int_id: item.productId,
        merchant_id: item.merchantId,
        title_ar: item.name_ar,
        title_en: item.name_en,
        sku: item.sku,
        product_slug: item.slug,
        merchant_slug: merchantSlug,
        merchant_store_name: storeName,
        primary_image_url: item.imageUrl,
        search_blob: `${item.name_en} ${item.name_ar} ${item.slug} ${merchantSlug} ${storeName}`.toLowerCase(),
        popularity_score: 80 - (idx % 50),
      };
    }),
    skipDuplicates: true,
  });
}
