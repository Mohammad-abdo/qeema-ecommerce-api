import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

const DEFAULT_ESY_BASE = 'https://api.esyasatgo.com/api';
const ESY_EXTERNAL_PREFIX = 'esyasatgo:';

type EsyPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type EsyProduct = {
  _id: string;
  title?: string;
  titleTr?: string;
  titleAr?: string;
  description?: string;
  descriptionTr?: string;
  descriptionAr?: string;
  slug?: string;
  price?: number;
  sku?: string;
  images?: string[];
  stock?: number;
};

function esyApiBase(): string {
  const raw = process.env.ESYASATGO_API_BASE?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, '') : DEFAULT_ESY_BASE;
}

function esyExternalId(mongoId: string): string {
  return `${ESY_EXTERNAL_PREFIX}${mongoId}`;
}

function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > 0 ? plain.slice(0, 65000) : undefined;
}

function safeSlugFromTitle(title: string, idSuffix: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  const tail = idSuffix.replace(/[^a-z0-9]/gi, '').slice(-10);
  if (base.length >= 3) return `${base}-${tail}`.slice(0, 120);
  return `import-${tail}`.slice(0, 120);
}

function resolveSlug(item: EsyProduct): string {
  const fromApi = item.slug?.trim();
  if (fromApi && /^[a-z0-9][a-z0-9-]*$/i.test(fromApi)) {
    return fromApi.toLowerCase().slice(0, 120);
  }
  const title = item.title || item.titleTr || item.titleAr || 'product';
  return safeSlugFromTitle(title, item._id);
}

/** Slug unique globally; skip rows owned by another merchant. */
async function resolveUniqueSlug(proposed: string, merchantId: number): Promise<string | null> {
  let slug = proposed;
  for (let i = 0; i < 12; i += 1) {
    const row = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, merchant_id: true },
    });
    if (!row) return slug;
    if (row.merchant_id === merchantId) return slug;
    slug = `${proposed}-${i + 2}`.slice(0, 120);
  }
  return null;
}

async function pickImportMerchantId(): Promise<number> {
  const approved = await prisma.merchant.findFirst({
    where: { deleted_at: null, status: 'approved' },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (approved) return approved.id;
  const anyMerch = await prisma.merchant.findFirst({
    where: { deleted_at: null },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (anyMerch) return anyMerch.id;
  throw new AppError(400, 'No merchant found to attach imported products', 'NO_MERCHANT');
}

async function syncProductImages(productId: number, urls: string[] | undefined) {
  if (!urls?.length) return;
  const imgs = urls.slice(0, 12).filter((u) => typeof u === 'string' && u.startsWith('http'));
  if (!imgs.length) return;
  await prisma.productImage.deleteMany({ where: { product_id: productId } });
  await prisma.productImage.createMany({
    data: imgs.map((image_url, i) => ({
      product_id: productId,
      image_url,
      is_primary: i === 0,
      sort_order: i,
    })),
  });
}

async function applyProductFields(
  productId: number,
  item: EsyProduct,
  name_en: string,
  name_ar: string,
  description_en: string | undefined,
  description_ar: string | undefined,
  price: Prisma.Decimal,
  stock: number,
  skuBase: string,
  variants: Array<{ id: number }>,
) {
  await prisma.product.update({
    where: { id: productId },
    data: {
      name_en,
      name_ar,
      ...(description_en != null ? { description_en } : {}),
      ...(description_ar != null ? { description_ar } : {}),
    },
  });

  const v0 = variants[0];
  if (v0) {
    await prisma.productVariant.update({
      where: { id: v0.id },
      data: { price, stock_quantity: stock },
    });
  } else {
    await prisma.productVariant.create({
      data: {
        product_id: productId,
        sku: skuBase,
        price,
        stock_quantity: stock,
      },
    });
  }
  await syncProductImages(productId, item.images);
}

async function upsertFromEsyItem(merchantId: number, item: EsyProduct): Promise<boolean> {
  const external_id = esyExternalId(item._id);
  const name_en = (item.title || item.titleTr || 'Imported').slice(0, 500);
  const name_ar = (item.titleAr || item.titleTr || name_en).slice(0, 500);
  const description_en = stripHtml(item.description ?? item.descriptionTr);
  const description_ar = stripHtml(item.descriptionAr ?? item.description ?? item.descriptionTr);
  const price = new Prisma.Decimal(Number.isFinite(Number(item.price)) ? Number(item.price) : 0);
  const stock = Number.isFinite(Number(item.stock)) ? Math.max(0, Math.floor(Number(item.stock))) : 0;
  const skuBase = (item.sku?.trim() || `esy-${item._id}`).slice(0, 64);

  const byExternal = await prisma.product.findUnique({
    where: { external_id },
    include: {
      variants: { where: { deleted_at: null }, orderBy: { id: 'asc' }, take: 1 },
    },
  });

  if (byExternal) {
    if (byExternal.merchant_id !== merchantId) return false;
    const slug = await resolveUniqueSlug(resolveSlug(item), merchantId);
    if (slug && slug !== byExternal.slug) {
      await prisma.product.update({ where: { id: byExternal.id }, data: { slug } });
    }
    await applyProductFields(
      byExternal.id,
      item,
      name_en,
      name_ar,
      description_en,
      description_ar,
      price,
      stock,
      skuBase,
      byExternal.variants,
    );
    return true;
  }

  const proposedSlug = resolveSlug(item);
  const existingBySlug = await prisma.product.findUnique({
    where: { slug: proposedSlug },
    select: { id: true, merchant_id: true, external_id: true },
  });

  if (existingBySlug) {
    if (existingBySlug.merchant_id !== merchantId) return false;
    if (existingBySlug.external_id && existingBySlug.external_id !== external_id) return false;
    const linked = await prisma.product.update({
      where: { id: existingBySlug.id },
      data: { external_id: existingBySlug.external_id ?? external_id },
      include: {
        variants: { where: { deleted_at: null }, orderBy: { id: 'asc' }, take: 1 },
      },
    });
    await applyProductFields(
      linked.id,
      item,
      name_en,
      name_ar,
      description_en,
      description_ar,
      price,
      stock,
      skuBase,
      linked.variants,
    );
    return true;
  }

  const slug = await resolveUniqueSlug(proposedSlug, merchantId);
  if (!slug) return false;

  const created = await prisma.product.create({
    data: {
      merchant_id: merchantId,
      external_id,
      name_en,
      name_ar,
      slug,
      description_en: description_en ?? undefined,
      description_ar: description_ar ?? description_en ?? undefined,
      status: 'pending_review',
      is_approved: false,
      variants: {
        create: [{ sku: skuBase, price, stock_quantity: stock }],
      },
    },
  });
  await syncProductImages(created.id, item.images);
  return true;
}

export async function syncEsyasatgoProducts(maxPages: number) {
  const merchantId = await pickImportMerchantId();
  const base = esyApiBase();
  let page = 1;
  let upserted = 0;
  let skipped = 0;
  let totalRemote = 0;
  let pagesFetched = 0;

  while (page <= maxPages) {
    const url = `${base}/products?page=${page}&limit=40`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new AppError(502, `Esyasatgo request failed (${res.status})`, 'ESY_UPSTREAM');
    }
    const json = (await res.json()) as {
      success?: boolean;
      data?: EsyProduct[];
      pagination?: EsyPagination;
    };
    const items = Array.isArray(json.data) ? json.data : [];
    const pag = json.pagination;
    if (pag?.total != null) totalRemote = pag.total;
    pagesFetched += 1;

    for (const row of items) {
      if (!row?._id) continue;
      const ok = await upsertFromEsyItem(merchantId, row);
      if (ok) upserted += 1;
      else skipped += 1;
    }

    const hasMore = pag?.hasMore === true || (pag != null && page < pag.totalPages);
    if (!hasMore || items.length === 0) break;
    page += 1;
  }

  return {
    upserted,
    skipped,
    pagesFetched,
    totalRemote,
    merchantId,
  };
}
