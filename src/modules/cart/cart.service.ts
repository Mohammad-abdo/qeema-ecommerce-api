import { Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { publishedProductWhere } from '../catalog/catalog.public.js';

import { resolveCartContext } from './cart.context.js';
import {
  deleteCart,
  guestCartKey,
  loadCart,
  refreshReservations,
  releaseReservation,
  saveCart,
  userCartKey,
} from './cart.redis.js';
import type { AddCartItemBody, UpdateCartItemBody } from './cart.validators.js';
import type { CartContext, CartLineItem, RedisCartPayload } from './cart.types.js';

const DECIMAL_ZERO = new Prisma.Decimal(0);

function decimalStr(v: Prisma.Decimal | number | string): string {
  return new Prisma.Decimal(v).toFixed(2);
}

function cartTotals(items: CartLineItem[]) {
  let subtotal = DECIMAL_ZERO;
  let itemCount = 0;
  for (const item of items) {
    const line = new Prisma.Decimal(item.price).mul(item.quantity);
    subtotal = subtotal.add(line);
    itemCount += item.quantity;
  }
  return {
    subtotal: decimalStr(subtotal),
    item_count: itemCount,
    line_count: items.length,
  };
}

export function cartResponse(ctx: CartContext, payload: RedisCartPayload) {
  const totals = cartTotals(payload.items);
  return {
    cart_id: ctx.cartId,
    is_guest: ctx.isGuest,
    items: payload.items.map((i) => ({
      variant_id: i.variantId,
      product_id: i.productId,
      merchant_id: i.merchantId,
      quantity: i.quantity,
      price: i.price,
      compare_price: i.compare_price,
      product_name_ar: i.product_name_ar,
      product_name_en: i.product_name_en,
      product_slug: i.product_slug ?? '',
      variant_label: i.variant_label,
      image_url: i.image_url,
      sku: i.sku,
      line_total: decimalStr(new Prisma.Decimal(i.price).mul(i.quantity)),
    })),
    ...totals,
  };
}

async function loadVariantForCart(variantId: number): Promise<CartLineItem> {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      deleted_at: null,
      is_active: true,
      product: publishedProductWhere(),
    },
    include: {
      product: {
        select: {
          id: true,
          merchant_id: true,
          name_ar: true,
          name_en: true,
          slug: true,
          images: {
            take: 1,
            orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
            select: { image_url: true },
          },
        },
      },
      attribute_values: {
        take: 3,
        include: { attribute_value: { select: { value: true } } },
      },
    },
  });
  if (!variant) throw new AppError(404, 'Variant not found or unavailable', 'NOT_FOUND');
  if (variant.stock_quantity < 1) {
    throw new AppError(400, 'Out of stock', 'OUT_OF_STOCK');
  }

  const labels = variant.attribute_values.map((av) => av.attribute_value.value).filter(Boolean);
  const variantLabel = labels.length ? labels.join(' / ') : variant.sku;

  return {
    variantId: variant.id,
    productId: variant.product_id,
    merchantId: variant.product.merchant_id,
    quantity: 1,
    price: decimalStr(variant.price),
    compare_price: variant.compare_at_price != null ? decimalStr(variant.compare_at_price) : null,
    product_name_ar: variant.product.name_ar,
    product_name_en: variant.product.name_en,
    product_slug: variant.product.slug,
    variant_label: variantLabel,
    image_url: variant.product.images[0]?.image_url ?? '',
    sku: variant.sku,
  };
}

async function availableStock(variantId: number): Promise<number> {
  const v = await prisma.productVariant.findFirst({
    where: { id: variantId, deleted_at: null, is_active: true },
    select: { stock_quantity: true },
  });
  return v?.stock_quantity ?? 0;
}

export async function getCart(request: FastifyRequest, reply: FastifyReply, userId?: number) {
  const ctx = resolveCartContext(request, reply, userId);
  const payload = await loadCart(ctx);
  return cartResponse(ctx, payload);
}

export async function addCartItem(
  request: FastifyRequest,
  reply: FastifyReply,
  body: AddCartItemBody,
  userId?: number,
) {
  const ctx = resolveCartContext(request, reply, userId);
  const line = await loadVariantForCart(body.variant_id);
  const stock = await availableStock(body.variant_id);
  const payload = await loadCart(ctx);
  const existing = payload.items.find((i) => i.variantId === body.variant_id);
  const nextQty = (existing?.quantity ?? 0) + body.quantity;
  if (nextQty > stock) {
    throw new AppError(400, `Only ${stock} in stock`, 'INSUFFICIENT_STOCK');
  }
  line.quantity = nextQty;
  if (existing) {
    payload.items = payload.items.map((i) => (i.variantId === body.variant_id ? line : i));
  } else {
    payload.items.push(line);
  }
  await saveCart(ctx, payload);
  await refreshReservations(ctx, payload.items);
  return cartResponse(ctx, payload);
}

export async function updateCartItem(
  request: FastifyRequest,
  reply: FastifyReply,
  variantId: number,
  body: UpdateCartItemBody,
  userId?: number,
) {
  const ctx = resolveCartContext(request, reply, userId);
  const payload = await loadCart(ctx);
  const existing = payload.items.find((i) => i.variantId === variantId);
  if (!existing) throw new AppError(404, 'Item not in cart', 'NOT_FOUND');

  if (body.quantity === 0) {
    payload.items = payload.items.filter((i) => i.variantId !== variantId);
    await releaseReservation(variantId, ctx.cartId);
  } else {
    const stock = await availableStock(variantId);
    if (body.quantity > stock) {
      throw new AppError(400, `Only ${stock} in stock`, 'INSUFFICIENT_STOCK');
    }
    existing.quantity = body.quantity;
    await refreshReservations(ctx, payload.items);
  }
  await saveCart(ctx, payload);
  return cartResponse(ctx, payload);
}

export async function removeCartItem(
  request: FastifyRequest,
  reply: FastifyReply,
  variantId: number,
  userId?: number,
) {
  return updateCartItem(request, reply, variantId, { quantity: 0 }, userId);
}

export async function clearCart(request: FastifyRequest, reply: FastifyReply, userId?: number) {
  const ctx = resolveCartContext(request, reply, userId);
  await deleteCart(ctx);
  return cartResponse(ctx, { items: [], updatedAt: new Date().toISOString() });
}

/** Merge guest cart into user cart after login */
export async function mergeGuestCartIntoUser(sessionId: string, userId: number): Promise<void> {
  const guestKey = guestCartKey(sessionId);
  const userKey = userCartKey(userId);
  const guestRaw = await loadCart({
    redisKey: guestKey,
    cartId: `guest:${sessionId}`,
    isGuest: true,
    sessionId,
  });
  if (!guestRaw.items.length) return;

  const userRaw = await loadCart({
    redisKey: userKey,
    cartId: `user:${userId}`,
    isGuest: false,
    userId,
  });

  for (const guestItem of guestRaw.items) {
    const stock = await availableStock(guestItem.variantId);
    const existing = userRaw.items.find((i) => i.variantId === guestItem.variantId);
    const mergedQty = Math.min((existing?.quantity ?? 0) + guestItem.quantity, stock);
    if (mergedQty < 1) continue;
    const merged = { ...guestItem, quantity: mergedQty };
    if (existing) {
      userRaw.items = userRaw.items.map((i) => (i.variantId === guestItem.variantId ? merged : i));
    } else {
      userRaw.items.push(merged);
    }
  }

  const userCtx: CartContext = {
    redisKey: userKey,
    cartId: `user:${userId}`,
    isGuest: false,
    userId,
  };
  await saveCart(userCtx, userRaw);
  await refreshReservations(userCtx, userRaw.items);
  await deleteCart({
    redisKey: guestKey,
    cartId: `guest:${sessionId}`,
    isGuest: true,
    sessionId,
  });
}

export async function getCartForCheckout(ctx: CartContext): Promise<RedisCartPayload> {
  const payload = await loadCart(ctx);
  if (!payload.items.length) {
    throw new AppError(400, 'Cart is empty', 'EMPTY_CART');
  }
  return payload;
}
