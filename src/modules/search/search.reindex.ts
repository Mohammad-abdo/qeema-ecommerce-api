import { prisma } from '../../lib/prisma.js';
import { publishedProductWhere } from '../catalog/catalog.public.js';

export async function reindexPublishedProducts() {
  const products = await prisma.product.findMany({
    where: publishedProductWhere(),
    include: {
      merchant: { select: { id: true, store_slug: true, store_name: true } },
      images: { take: 1, orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }] },
      variants: { where: { deleted_at: null, is_active: true }, take: 1, orderBy: { price: 'asc' } },
    },
  });

  let upserted = 0;
  for (const p of products) {
    const v0 = p.variants[0];
    const image = p.images[0]?.image_url ?? null;
    const blob = `${p.name_en} ${p.name_ar} ${p.slug} ${p.merchant.store_name}`.toLowerCase();

    await prisma.searchIndex.upsert({
      where: {
        entity_type_entity_int_id: {
          entity_type: 'product',
          entity_int_id: p.id,
        },
      },
      create: {
        entity_type: 'product',
        entity_int_id: p.id,
        merchant_id: p.merchant_id,
        title_ar: p.name_ar,
        title_en: p.name_en,
        sku: v0?.sku ?? null,
        product_slug: p.slug,
        merchant_slug: p.merchant.store_slug,
        merchant_store_name: p.merchant.store_name,
        primary_image_url: image,
        search_blob: blob,
        popularity_score: p.view_count,
      },
      update: {
        title_ar: p.name_ar,
        title_en: p.name_en,
        sku: v0?.sku ?? null,
        product_slug: p.slug,
        merchant_slug: p.merchant.store_slug,
        merchant_store_name: p.merchant.store_name,
        primary_image_url: image,
        search_blob: blob,
        popularity_score: p.view_count,
        deleted_at: null,
      },
    });
    upserted += 1;
  }

  return { upserted };
}
