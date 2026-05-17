import type { CartContext, CartLineItem, RedisCartPayload } from './cart.types.js';

/** In-process cart storage (no Redis required). */
const cartStore = new Map<string, RedisCartPayload>();
const reserveStore = new Map<string, string>();
const checkoutLocks = new Map<string, number>();

const CART_TTL_MS = 60 * 60 * 24 * 7 * 1000;

function pruneExpired() {
  const now = Date.now();
  for (const [key, lockUntil] of checkoutLocks) {
    if (lockUntil <= now) checkoutLocks.delete(key);
  }
}

export function cartRedisKey(ctx: CartContext): string {
  return ctx.redisKey;
}

function reserveKey(variantId: number, cartId: string): string {
  return `reserve:${variantId}:${cartId}`;
}

export async function loadCart(ctx: CartContext): Promise<RedisCartPayload> {
  pruneExpired();
  const raw = cartStore.get(cartRedisKey(ctx));
  if (!raw) return { items: [], updatedAt: new Date().toISOString() };
  const updated = new Date(raw.updatedAt).getTime();
  if (Date.now() - updated > CART_TTL_MS) {
    cartStore.delete(cartRedisKey(ctx));
    return { items: [], updatedAt: new Date().toISOString() };
  }
  return raw;
}

export async function saveCart(ctx: CartContext, payload: RedisCartPayload): Promise<void> {
  payload.updatedAt = new Date().toISOString();
  cartStore.set(cartRedisKey(ctx), payload);
}

export async function deleteCart(ctx: CartContext): Promise<void> {
  const cart = await loadCart(ctx);
  for (const item of cart.items) {
    reserveStore.delete(reserveKey(item.variantId, ctx.cartId));
  }
  cartStore.delete(cartRedisKey(ctx));
}

export async function setReservation(variantId: number, cartId: string, quantity: number): Promise<void> {
  reserveStore.set(reserveKey(variantId, cartId), String(quantity));
}

export async function releaseReservation(variantId: number, cartId: string): Promise<void> {
  reserveStore.delete(reserveKey(variantId, cartId));
}

export async function refreshReservations(ctx: CartContext, items: CartLineItem[]): Promise<void> {
  const variantIds = new Set(items.map((i) => i.variantId));
  for (const key of [...reserveStore.keys()]) {
    if (key.endsWith(`:${ctx.cartId}`)) {
      const parts = key.split(':');
      const vid = Number(parts[1]);
      if (!variantIds.has(vid)) reserveStore.delete(key);
    }
  }
  for (const item of items) {
    await setReservation(item.variantId, ctx.cartId, item.quantity);
  }
}

export async function acquireCheckoutLock(cartId: string, ttlSec = 30): Promise<boolean> {
  pruneExpired();
  const key = `checkout:lock:${cartId}`;
  if (checkoutLocks.has(key) && checkoutLocks.get(key)! > Date.now()) return false;
  checkoutLocks.set(key, Date.now() + ttlSec * 1000);
  return true;
}

export async function releaseCheckoutLock(cartId: string): Promise<void> {
  checkoutLocks.delete(`checkout:lock:${cartId}`);
}

export function guestCartKey(sessionId: string): string {
  return `cart:guest:${sessionId}`;
}

export function userCartKey(userId: number): string {
  return `cart:user:${userId}`;
}
