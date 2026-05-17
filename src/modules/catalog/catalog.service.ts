import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { canModerateCatalog, isStaffRole } from '../../lib/rbac.js';

import {
  productListOrderBy,
  publicProductDetailInclude,
  publicProductListSelect,
  publishedProductWhere,
  sortProductsByPrice,
} from './catalog.public.js';
import type { AdminProductListQuery, MerchantProductListQuery, ProductListQuery } from './catalog.validators.js';
import type {
  CreateAdminProductBody,
  CreateMerchantProductBody,
  CreateProductImageBody,
  CreateVariantBody,
  ModerateProductBody,
  PatchMerchantProductBody,
  PatchVariantBody,
} from './catalog.validators.js';

export async function listProducts(q: ProductListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.ProductWhereInput = publishedProductWhere(
    q.merchantId ? { merchant_id: q.merchantId } : {},
  );

  if (q.featured) where.is_featured = true;

  if (q.flash) {
    where.flash_sale_items = {
      some: {
        flash_sale: {
          is_active: true,
          starts_at: { lte: new Date() },
          ends_at: { gte: new Date() },
        },
      },
    };
  }

  if (q.category) {
    const cat = await prisma.category.findFirst({
      where: { slug: q.category, deleted_at: null, is_active: true },
      select: { id: true },
    });
    if (!cat) return { items: [], total: 0, page: q.page, limit: q.limit };
    where.category_id = cat.id;
  }

  if (q.search?.trim()) {
    const term = q.search.trim();
    const hits = await prisma.searchIndex.findMany({
      where: {
        deleted_at: null,
        entity_type: 'product',
        OR: [
          { title_en: { contains: term } },
          { title_ar: { contains: term } },
          { search_blob: { contains: term } },
          { sku: { contains: term } },
          { product_slug: { contains: term } },
        ],
      },
      take: 500,
      select: { entity_int_id: true },
    });
    const ids = [...new Set(hits.map((h) => h.entity_int_id).filter((id): id is number => id != null))];
    if (!ids.length) return { items: [], total: 0, page: q.page, limit: q.limit };
    where.id = { in: ids };
  }

  if (q.minPrice != null || q.maxPrice != null) {
    where.variants = {
      some: {
        deleted_at: null,
        is_active: true,
        ...(q.minPrice != null ? { price: { gte: new Prisma.Decimal(q.minPrice) } } : {}),
        ...(q.maxPrice != null ? { price: { lte: new Prisma.Decimal(q.maxPrice) } } : {}),
      },
    };
  }

  const orderBy = productListOrderBy(q.sort);

  const [itemsRaw, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: q.limit,
      select: publicProductListSelect,
    }),
    prisma.product.count({ where }),
  ]);

  const items =
    q.sort === 'price_asc' || q.sort === 'price_desc'
      ? sortProductsByPrice(itemsRaw, q.sort)
      : itemsRaw;

  return { items, total, page: q.page, limit: q.limit };
}

export async function getProductBySlug(slug: string) {
  const p = await prisma.product.findFirst({
    where: publishedProductWhere({ slug }),
    include: publicProductDetailInclude,
  });
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');

  const related_products = p.relations_from
    .map((r) => r.related_product)
    .filter(
      (rp): rp is NonNullable<typeof rp> =>
        rp != null &&
        !rp.deleted_at &&
        rp.status === 'published' &&
        rp.is_approved,
    );

  const { relations_from: _rf, ...rest } = p;
  return { ...rest, related_products };
}

export async function listPublicCategories() {
  return prisma.category.findMany({
    where: { deleted_at: null, is_active: true },
    orderBy: [{ sort_order: 'asc' }, { name_en: 'asc' }],
    select: {
      id: true,
      name_en: true,
      name_ar: true,
      slug: true,
      description_en: true,
      description_ar: true,
      icon: true,
      image: true,
      parent_id: true,
    },
  });
}

export async function listProductsAdmin(q: AdminProductListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.ProductWhereInput = { deleted_at: null };
  if (q.merchantId) where.merchant_id = q.merchantId;
  if (q.status) where.status = q.status;
  if (q.isApproved !== undefined) where.is_approved = q.isApproved;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }
  if (q.search) {
    where.OR = [
      { name_ar: { contains: q.search } },
      { name_en: { contains: q.search } },
      { slug: { contains: q.search } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
      include: {
        merchant: { select: { id: true, store_name: true, store_slug: true } },
        variants: { take: 3, where: { deleted_at: null } },
        images: { take: 1, orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }] },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function listProductsMerchant(merchantUserId: number, q: MerchantProductListQuery) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.ProductWhereInput = { deleted_at: null, merchant_id: mid };
  if (q.status) where.status = q.status;
  if (q.search) {
    where.OR = [
      { name_ar: { contains: q.search } },
      { name_en: { contains: q.search } },
      { slug: { contains: q.search } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
      include: {
        variants: { take: 3, where: { deleted_at: null } },
        images: { take: 1, orderBy: { sort_order: 'asc' } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function getProductAdmin(productId: number) {
  const p = await prisma.product.findFirst({
    where: { id: productId, deleted_at: null },
    include: {
      merchant: { select: { id: true, store_name: true, store_slug: true } },
      variants: { where: { deleted_at: null }, orderBy: { id: 'asc' } },
      images: { orderBy: { sort_order: 'asc' } },
    },
  });
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  return p;
}

export async function createAdminProduct(body: CreateAdminProductBody) {
  const merchant = await prisma.merchant.findFirst({
    where: { id: body.merchant_id, deleted_at: null },
    select: { id: true },
  });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');

  const publish = body.publish === true;
  const images = body.images ?? [];
  try {
    const product = await prisma.product.create({
      data: {
        merchant_id: body.merchant_id,
        name_ar: body.name_ar,
        name_en: body.name_en,
        slug: body.slug,
        category_id: body.category_id ?? undefined,
        brand_id: body.brand_id ?? undefined,
        description_ar: body.description_ar ?? undefined,
        description_en: body.description_en ?? undefined,
        status: publish ? 'published' : 'draft',
        is_approved: publish,
        is_featured: body.is_featured === true,
        published_at: publish ? new Date() : undefined,
        variants: {
          create: body.variants.map((v) => ({
            sku: v.sku,
            price: new Prisma.Decimal(v.price),
            stock_quantity: v.stock_quantity,
            compare_at_price:
              v.compare_at_price != null ? new Prisma.Decimal(v.compare_at_price) : undefined,
            is_active: true,
          })),
        },
        ...(images.length
          ? {
              images: {
                create: images.map((img, i) => ({
                  image_url: img.image_url,
                  alt_text: img.alt_text,
                  is_primary: img.is_primary ?? i === 0,
                  sort_order: i,
                })),
              },
            }
          : {}),
      },
      include: {
        variants: { where: { deleted_at: null } },
        images: { orderBy: { sort_order: 'asc' } },
        merchant: { select: { id: true, store_name: true, store_slug: true } },
      },
    });
    return product;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Slug or SKU conflict', 'CONFLICT');
    }
    throw e;
  }
}

export async function moderateProductAdmin(productId: number, body: ModerateProductBody) {
  const p = await prisma.product.findFirst({ where: { id: productId, deleted_at: null } });
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.is_approved != null ? { is_approved: body.is_approved } : {}),
      ...(body.is_featured != null ? { is_featured: body.is_featured } : {}),
      ...(body.rejection_reason !== undefined ? { rejection_reason: body.rejection_reason } : {}),
    },
  });
}

export async function createAdminProductImage(
  productId: number,
  body: { image_url: string; alt_text?: string; is_primary?: boolean; sort_order?: number },
) {
  const p = await prisma.product.findFirst({ where: { id: productId, deleted_at: null } });
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  if (body.is_primary) {
    await prisma.productImage.updateMany({
      where: { product_id: productId },
      data: { is_primary: false },
    });
  }
  return prisma.productImage.create({
    data: {
      product_id: productId,
      image_url: body.image_url,
      alt_text: body.alt_text,
      is_primary: body.is_primary ?? false,
      sort_order: body.sort_order ?? 0,
    },
  });
}

async function getOwnedProductOrThrow(merchantUserId: number, productId: number) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  const p = await prisma.product.findFirst({
    where: { id: productId, merchant_id: mid, deleted_at: null },
  });
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  return p;
}

export async function getMerchantProduct(merchantUserId: number, productId: number) {
  await getOwnedProductOrThrow(merchantUserId, productId);
  const p = await prisma.product.findFirst({
    where: { id: productId, deleted_at: null },
    include: {
      variants: { where: { deleted_at: null }, orderBy: { id: 'asc' } },
      images: { orderBy: { sort_order: 'asc' } },
    },
  });
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  return p;
}

export async function createMerchantProduct(merchantUserId: number, body: CreateMerchantProductBody) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  try {
    return await prisma.product.create({
      data: {
        merchant_id: mid,
        name_ar: body.name_ar,
        name_en: body.name_en,
        slug: body.slug,
        category_id: body.category_id ?? undefined,
        brand_id: body.brand_id ?? undefined,
        description_ar: body.description_ar ?? undefined,
        description_en: body.description_en ?? undefined,
        status: 'draft',
        is_approved: false,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Slug or unique field conflict', 'CONFLICT');
    }
    throw e;
  }
}

export async function updateMerchantProduct(
  merchantUserId: number,
  productId: number,
  body: PatchMerchantProductBody,
) {
  await getOwnedProductOrThrow(merchantUserId, productId);
  try {
    return await prisma.product.update({
      where: { id: productId },
      data: {
        ...(body.name_ar != null ? { name_ar: body.name_ar } : {}),
        ...(body.name_en != null ? { name_en: body.name_en } : {}),
        ...(body.slug != null ? { slug: body.slug } : {}),
        ...(body.category_id !== undefined ? { category_id: body.category_id } : {}),
        ...(body.brand_id !== undefined ? { brand_id: body.brand_id } : {}),
        ...(body.description_ar !== undefined ? { description_ar: body.description_ar } : {}),
        ...(body.description_en !== undefined ? { description_en: body.description_en } : {}),
        ...(body.status != null ? { status: body.status } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Slug or unique field conflict', 'CONFLICT');
    }
    throw e;
  }
}

export async function deleteMerchantProduct(merchantUserId: number, productId: number) {
  await getOwnedProductOrThrow(merchantUserId, productId);
  return prisma.product.update({
    where: { id: productId },
    data: { deleted_at: new Date() },
  });
}

export async function createProductVariant(
  merchantUserId: number,
  productId: number,
  body: CreateVariantBody,
) {
  await getOwnedProductOrThrow(merchantUserId, productId);
  try {
    return await prisma.productVariant.create({
      data: {
        product_id: productId,
        sku: body.sku,
        price: new Prisma.Decimal(body.price),
        stock_quantity: body.stock_quantity,
        compare_at_price:
          body.compare_at_price != null ? new Prisma.Decimal(body.compare_at_price) : undefined,
        barcode: body.barcode ?? undefined,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'SKU already exists', 'CONFLICT');
    }
    throw e;
  }
}

async function getOwnedVariantOrThrow(merchantUserId: number, variantId: number) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  const v = await prisma.productVariant.findFirst({
    where: { id: variantId, deleted_at: null, product: { merchant_id: mid, deleted_at: null } },
    include: { product: true },
  });
  if (!v) throw new AppError(404, 'Variant not found', 'NOT_FOUND');
  return v;
}

export async function updateProductVariant(merchantUserId: number, variantId: number, body: PatchVariantBody) {
  await getOwnedVariantOrThrow(merchantUserId, variantId);
  try {
    return await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(body.sku != null ? { sku: body.sku } : {}),
        ...(body.price != null ? { price: new Prisma.Decimal(body.price) } : {}),
        ...(body.stock_quantity != null ? { stock_quantity: body.stock_quantity } : {}),
        ...(body.compare_at_price !== undefined
          ? { compare_at_price: body.compare_at_price != null ? new Prisma.Decimal(body.compare_at_price) : null }
          : {}),
        ...(body.is_active != null ? { is_active: body.is_active } : {}),
        ...(body.barcode !== undefined ? { barcode: body.barcode } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'SKU already exists', 'CONFLICT');
    }
    throw e;
  }
}

export async function deleteProductVariant(merchantUserId: number, variantId: number) {
  await getOwnedVariantOrThrow(merchantUserId, variantId);
  return prisma.productVariant.update({
    where: { id: variantId },
    data: { deleted_at: new Date() },
  });
}

export async function createProductImage(
  merchantUserId: number,
  productId: number,
  body: CreateProductImageBody,
) {
  await getOwnedProductOrThrow(merchantUserId, productId);
  return prisma.productImage.create({
    data: {
      product_id: productId,
      image_url: body.image_url,
      alt_text: body.alt_text ?? undefined,
      sort_order: body.sort_order,
      is_primary: body.is_primary,
    },
  });
}

export async function deleteProductImage(merchantUserId: number, imageId: number) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  const img = await prisma.productImage.findFirst({
    where: { id: imageId, product: { merchant_id: mid, deleted_at: null } },
  });
  if (!img) throw new AppError(404, 'Image not found', 'NOT_FOUND');
  return prisma.productImage.delete({ where: { id: imageId } });
}

export function assertStaffCatalogList(role: string) {
  if (!isStaffRole(role)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}

export function assertAdminCatalogModerate(role: string) {
  if (!canModerateCatalog(role)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}
