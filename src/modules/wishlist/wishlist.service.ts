import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { publicProductListSelect } from '../catalog/catalog.public.js';

export async function listWishlist(userId: number) {
  const rows = await prisma.wishlist.findMany({
    where: { customer_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      product: { select: publicProductListSelect },
    },
  });
  return rows.map((r) => ({
    product_id: r.product_id,
    created_at: r.created_at,
    product: r.product,
  }));
}

export async function listWishlistProductIds(userId: number) {
  const rows = await prisma.wishlist.findMany({
    where: { customer_id: userId },
    select: { product_id: true },
  });
  return rows.map((r) => r.product_id);
}

export async function addToWishlist(userId: number, productId: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deleted_at: null, status: 'published' },
  });
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');

  await prisma.wishlist.upsert({
    where: {
      customer_id_product_id: { customer_id: userId, product_id: productId },
    },
    create: { customer_id: userId, product_id: productId },
    update: {},
  });
  return { product_id: productId, added: true };
}

export async function removeFromWishlist(userId: number, productId: number) {
  await prisma.wishlist.deleteMany({
    where: { customer_id: userId, product_id: productId },
  });
  return { product_id: productId, removed: true };
}

export async function resolveProductIdBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, deleted_at: null, status: 'published' },
    select: { id: true },
  });
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  return product.id;
}
