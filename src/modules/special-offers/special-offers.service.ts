import { Prisma, SpecialOfferStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { publishedProductWhere } from '../catalog/catalog.public.js';

import { mapSpecialOfferRow, specialOfferInclude } from './special-offers.mapper.js';
import type {
  CreateSpecialOfferAdminBody,
  CreateSpecialOfferMerchantBody,
  PatchSpecialOfferBody,
  PublicSpecialOfferListQuery,
  SpecialOfferListQuery,
} from './special-offers.validators.js';

function makeSlug(base: string): string {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const suffix = randomBytes(3).toString('hex');
  return `${clean || 'offer'}-${suffix}`;
}

function activeOfferWhere(now = new Date()): Prisma.SpecialOfferWhereInput {
  return {
    deleted_at: null,
    status: 'active',
    AND: [
      { OR: [{ starts_at: null }, { starts_at: { lte: now } }] },
      { OR: [{ ends_at: null }, { ends_at: { gte: now } }] },
    ],
  };
}

async function validateOfferItems(
  merchantId: number,
  items: Array<{ product_id: number; variant_id?: number | null; quantity: number }>,
) {
  if (items.length < 2) {
    throw new AppError(400, 'An offer must include at least 2 products', 'MIN_PRODUCTS');
  }
  const productIds = [...new Set(items.map((i) => i.product_id))];
  if (productIds.length !== items.length) {
    throw new AppError(400, 'Each product can only appear once in an offer', 'DUPLICATE_PRODUCT');
  }

  const products = await prisma.product.findMany({
    where: publishedProductWhere({
      id: { in: productIds },
      merchant_id: merchantId,
    }),
    include: {
      variants: {
        where: { deleted_at: null, is_active: true },
        select: { id: true },
      },
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(400, 'One or more products are invalid or not published for this store', 'INVALID_PRODUCTS');
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of items) {
    const p = productMap.get(item.product_id);
    if (!p) continue;
    if (item.variant_id) {
      const ok = p.variants.some((v) => v.id === item.variant_id);
      if (!ok) {
        throw new AppError(400, `Variant ${item.variant_id} is not valid for product ${item.product_id}`, 'INVALID_VARIANT');
      }
    }
  }
}

async function computeOriginalTotal(
  items: Array<{ product_id: number; variant_id?: number | null; quantity: number }>,
) {
  let total = 0;
  for (const item of items) {
    const variant = item.variant_id
      ? await prisma.productVariant.findFirst({
          where: { id: item.variant_id, product_id: item.product_id, deleted_at: null, is_active: true },
        })
      : await prisma.productVariant.findFirst({
          where: { product_id: item.product_id, deleted_at: null, is_active: true },
          orderBy: { price: 'asc' },
        });
    if (!variant) {
      throw new AppError(400, `No active variant for product ${item.product_id}`, 'NO_VARIANT');
    }
    total += Number(variant.price) * item.quantity;
  }
  return total;
}

async function ensureUniqueSlug(slug: string, excludeId?: number) {
  const existing = await prisma.specialOffer.findFirst({
    where: { slug, deleted_at: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) throw new AppError(409, 'Slug already in use', 'SLUG_EXISTS');
}

export async function listPublicSpecialOffers(q: PublicSpecialOfferListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.SpecialOfferWhereInput = {
    ...activeOfferWhere(),
    ...(q.featured ? { is_featured: true } : {}),
    ...(q.merchant_id ? { merchant_id: q.merchant_id } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.specialOffer.findMany({
      where,
      orderBy: [{ is_featured: 'desc' }, { sort_order: 'asc' }, { created_at: 'desc' }],
      skip,
      take: q.limit,
      include: specialOfferInclude,
    }),
    prisma.specialOffer.count({ where }),
  ]);

  return {
    items: rows.map(mapSpecialOfferRow),
    total,
    page: q.page,
    limit: q.limit,
  };
}

export async function getPublicSpecialOfferBySlug(slug: string) {
  const row = await prisma.specialOffer.findFirst({
    where: { ...activeOfferWhere(), slug },
    include: specialOfferInclude,
  });
  if (!row) throw new AppError(404, 'Offer not found', 'NOT_FOUND');
  return mapSpecialOfferRow(row);
}

export async function listSpecialOffersAdmin(q: SpecialOfferListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.SpecialOfferWhereInput = { deleted_at: null };
  if (q.status) where.status = q.status;
  if (q.merchant_id) where.merchant_id = q.merchant_id;
  if (q.search) {
    where.OR = [
      { title_en: { contains: q.search } },
      { title_ar: { contains: q.search } },
      { slug: { contains: q.search } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.specialOffer.findMany({
      where,
      orderBy: [{ created_at: 'desc' }],
      skip,
      take: q.limit,
      include: specialOfferInclude,
    }),
    prisma.specialOffer.count({ where }),
  ]);

  return { items: rows.map(mapSpecialOfferRow), total, page: q.page, limit: q.limit };
}

export async function listSpecialOffersMerchant(userId: number, q: SpecialOfferListQuery) {
  const merchant = await prisma.merchant.findUnique({ where: { user_id: userId } });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');

  return listSpecialOffersAdmin({
    ...q,
    merchant_id: merchant.id,
  });
}

export async function getSpecialOfferAdmin(id: number) {
  const row = await prisma.specialOffer.findFirst({
    where: { id, deleted_at: null },
    include: specialOfferInclude,
  });
  if (!row) throw new AppError(404, 'Offer not found', 'NOT_FOUND');
  return mapSpecialOfferRow(row);
}

export async function getSpecialOfferMerchant(userId: number, id: number) {
  const merchant = await prisma.merchant.findUnique({ where: { user_id: userId } });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');

  const row = await prisma.specialOffer.findFirst({
    where: { id, merchant_id: merchant.id, deleted_at: null },
    include: specialOfferInclude,
  });
  if (!row) throw new AppError(404, 'Offer not found', 'NOT_FOUND');
  return mapSpecialOfferRow(row);
}

async function createOffer(
  createdBy: number,
  merchantId: number,
  body: CreateSpecialOfferAdminBody | CreateSpecialOfferMerchantBody,
) {
  await validateOfferItems(merchantId, body.items);
  const originalTotal = await computeOriginalTotal(body.items);
  if (body.bundle_price >= originalTotal) {
    throw new AppError(400, 'Bundle price must be lower than the sum of product prices', 'INVALID_BUNDLE_PRICE');
  }

  const slug = body.slug ?? makeSlug(body.title_en);
  await ensureUniqueSlug(slug);

  const imageUrl =
    body.image_url ??
    (
      await prisma.productImage.findFirst({
        where: { product_id: body.items[0]!.product_id },
        orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
        select: { image_url: true },
      })
    )?.image_url ??
    null;

  const row = await prisma.specialOffer.create({
    data: {
      merchant_id: merchantId,
      created_by: createdBy,
      title_en: body.title_en,
      title_ar: body.title_ar,
      slug,
      description_en: body.description_en ?? null,
      description_ar: body.description_ar ?? null,
      image_url: imageUrl,
      bundle_price: new Prisma.Decimal(body.bundle_price),
      status: body.status ?? 'draft',
      is_featured: body.is_featured ?? false,
      sort_order: body.sort_order ?? 0,
      starts_at: body.starts_at ?? null,
      ends_at: body.ends_at ?? null,
      items: {
        create: body.items.map((item, idx) => ({
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          sort_order: item.sort_order ?? idx,
        })),
      },
    },
    include: specialOfferInclude,
  });

  return mapSpecialOfferRow(row);
}

export async function createSpecialOfferAdmin(userId: number, body: CreateSpecialOfferAdminBody) {
  const merchant = await prisma.merchant.findFirst({
    where: { id: body.merchant_id, deleted_at: null, status: 'approved' },
  });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');
  return createOffer(userId, merchant.id, body);
}

export async function createSpecialOfferMerchant(userId: number, body: CreateSpecialOfferMerchantBody) {
  const merchant = await prisma.merchant.findUnique({ where: { user_id: userId } });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');
  return createOffer(userId, merchant.id, body);
}

async function patchOffer(
  offerId: number,
  merchantId: number | null,
  body: PatchSpecialOfferBody,
) {
  const existing = await prisma.specialOffer.findFirst({
    where: {
      id: offerId,
      deleted_at: null,
      ...(merchantId != null ? { merchant_id: merchantId } : {}),
    },
    include: { items: true },
  });
  if (!existing) throw new AppError(404, 'Offer not found', 'NOT_FOUND');

  const effectiveMerchantId = existing.merchant_id;
  if (!effectiveMerchantId) {
    throw new AppError(400, 'Offer has no merchant', 'INVALID_OFFER');
  }

  const nextItems = body.items ?? existing.items.map((i) => ({
    product_id: i.product_id,
    variant_id: i.variant_id,
    quantity: i.quantity,
    sort_order: i.sort_order,
  }));

  if (body.items) {
    await validateOfferItems(effectiveMerchantId, nextItems);
  }

  const bundlePrice = body.bundle_price ?? Number(existing.bundle_price);
  const originalTotal = await computeOriginalTotal(nextItems);
  if (bundlePrice >= originalTotal) {
    throw new AppError(400, 'Bundle price must be lower than the sum of product prices', 'INVALID_BUNDLE_PRICE');
  }

  if (body.slug && body.slug !== existing.slug) {
    await ensureUniqueSlug(body.slug, offerId);
  }

  const row = await prisma.$transaction(async (tx) => {
    if (body.items) {
      await tx.specialOfferItem.deleteMany({ where: { special_offer_id: offerId } });
    }

    return tx.specialOffer.update({
      where: { id: offerId },
      data: {
        ...(body.title_en != null ? { title_en: body.title_en } : {}),
        ...(body.title_ar != null ? { title_ar: body.title_ar } : {}),
        ...(body.slug != null ? { slug: body.slug } : {}),
        ...(body.description_en !== undefined ? { description_en: body.description_en } : {}),
        ...(body.description_ar !== undefined ? { description_ar: body.description_ar } : {}),
        ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
        ...(body.bundle_price != null ? { bundle_price: new Prisma.Decimal(body.bundle_price) } : {}),
        ...(body.status != null ? { status: body.status } : {}),
        ...(body.is_featured != null ? { is_featured: body.is_featured } : {}),
        ...(body.sort_order != null ? { sort_order: body.sort_order } : {}),
        ...(body.starts_at !== undefined ? { starts_at: body.starts_at } : {}),
        ...(body.ends_at !== undefined ? { ends_at: body.ends_at } : {}),
        ...(body.items
          ? {
              items: {
                create: body.items.map((item, idx) => ({
                  product_id: item.product_id,
                  variant_id: item.variant_id ?? null,
                  quantity: item.quantity,
                  sort_order: item.sort_order ?? idx,
                })),
              },
            }
          : {}),
      },
      include: specialOfferInclude,
    });
  });

  return mapSpecialOfferRow(row);
}

export async function patchSpecialOfferAdmin(id: number, body: PatchSpecialOfferBody) {
  return patchOffer(id, null, body);
}

export async function patchSpecialOfferMerchant(userId: number, id: number, body: PatchSpecialOfferBody) {
  const merchant = await prisma.merchant.findUnique({ where: { user_id: userId } });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');
  return patchOffer(id, merchant.id, body);
}

export async function deleteSpecialOfferAdmin(id: number) {
  const existing = await prisma.specialOffer.findFirst({ where: { id, deleted_at: null } });
  if (!existing) throw new AppError(404, 'Offer not found', 'NOT_FOUND');
  await prisma.specialOffer.update({
    where: { id },
    data: { deleted_at: new Date(), status: SpecialOfferStatus.paused },
  });
  return { success: true };
}

export async function deleteSpecialOfferMerchant(userId: number, id: number) {
  const merchant = await prisma.merchant.findUnique({ where: { user_id: userId } });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');

  const existing = await prisma.specialOffer.findFirst({
    where: { id, merchant_id: merchant.id, deleted_at: null },
  });
  if (!existing) throw new AppError(404, 'Offer not found', 'NOT_FOUND');

  await prisma.specialOffer.update({
    where: { id },
    data: { deleted_at: new Date(), status: SpecialOfferStatus.paused },
  });
  return { success: true };
}
