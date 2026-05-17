import { InventoryAction, PaymentMethod, Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { resolveCartContext } from '../cart/cart.context.js';
import { acquireCheckoutLock, deleteCart, releaseCheckoutLock } from '../cart/cart.redis.js';
import { getCartForCheckout } from '../cart/cart.service.js';
import { getAddressForUser } from '../addresses/addresses.service.js';

import { createCommissionForSubOrder } from './commission.service.js';
import type { CheckoutBody } from './checkout.validators.js';

const SHIPPING_FLAT = new Prisma.Decimal(50);

async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `ORD-${y}${m}-`;
  const last = await tx.order.findFirst({
    where: { order_number: { startsWith: prefix } },
    orderBy: { id: 'desc' },
    select: { order_number: true },
  });
  let seq = 1;
  if (last?.order_number) {
    const tail = last.order_number.slice(prefix.length);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

export async function checkoutOrder(
  request: FastifyRequest,
  reply: FastifyReply,
  userId: number,
  body: CheckoutBody,
) {
  if (body.payment_method !== 'cod') {
    throw new AppError(400, 'Only cash on delivery is supported', 'PAYMENT_NOT_SUPPORTED');
  }
  if (body.coupon_code) {
    throw new AppError(400, 'Coupons are not enabled yet', 'COUPON_NOT_SUPPORTED');
  }

  const ctx = resolveCartContext(request, reply, userId);
  const locked = await acquireCheckoutLock(ctx.cartId);
  if (!locked) {
    throw new AppError(409, 'Checkout already in progress', 'CHECKOUT_IN_PROGRESS');
  }

  try {
    const cartPayload = await getCartForCheckout(ctx);
    await getAddressForUser(userId, body.address_id);

    const variantIds = cartPayload.items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, deleted_at: null, is_active: true },
      include: {
        product: {
          select: { id: true, merchant_id: true, status: true, is_approved: true, deleted_at: true },
        },
      },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = new Prisma.Decimal(0);
    for (const item of cartPayload.items) {
      const v = variantMap.get(item.variantId);
      if (!v || v.product.deleted_at || v.product.status !== 'published' || !v.product.is_approved) {
        throw new AppError(400, 'A product in your cart is no longer available', 'INVALID_CART');
      }
      if (v.stock_quantity < item.quantity) {
        throw new AppError(400, `Insufficient stock for ${item.sku}`, 'INSUFFICIENT_STOCK');
      }
      subtotal = subtotal.add(new Prisma.Decimal(item.price).mul(item.quantity));
    }

    const shipping = SHIPPING_FLAT;
    const discount = new Prisma.Decimal(0);
    const tax = new Prisma.Decimal(0);
    const total = subtotal.add(shipping).sub(discount).add(tax);

    const order = await prisma.$transaction(async (tx) => {
      for (const item of cartPayload.items) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock_quantity: { gte: item.quantity },
          },
          data: { stock_quantity: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new AppError(400, `Insufficient stock for ${item.sku}`, 'INSUFFICIENT_STOCK');
        }
      }

      const orderNumber = await nextOrderNumber(tx);
      const created = await tx.order.create({
        data: {
          order_number: orderNumber,
          customer_id: userId,
          status: 'pending',
          payment_status: 'unpaid',
          payment_method: PaymentMethod.cod,
          subtotal,
          shipping_amount: shipping,
          discount_amount: discount,
          tax_amount: tax,
          total_amount: total,
          currency: 'EGP',
          shipping_address_id: body.address_id,
          billing_address_id: body.address_id,
          ip_address: request.ip,
        },
      });

      const byMerchant = new Map<number, typeof cartPayload.items>();
      for (const item of cartPayload.items) {
        const list = byMerchant.get(item.merchantId) ?? [];
        list.push(item);
        byMerchant.set(item.merchantId, list);
      }

      for (const [merchantId, lines] of byMerchant) {
        let subOrderSubtotal = new Prisma.Decimal(0);
        for (const line of lines) {
          subOrderSubtotal = subOrderSubtotal.add(new Prisma.Decimal(line.price).mul(line.quantity));
        }
        const merchant = await tx.merchant.findUnique({
          where: { id: merchantId },
          select: { commission_rate: true },
        });
        const rate = merchant?.commission_rate ?? new Prisma.Decimal(10);
        const commission_amount = subOrderSubtotal.mul(rate).div(100);
        const subOrderTotal = subOrderSubtotal.add(shipping.div(byMerchant.size));

        const subOrder = await tx.subOrder.create({
          data: {
            order_id: created.id,
            merchant_id: merchantId,
            status: 'pending',
            subtotal: subOrderSubtotal,
            shipping_amount: shipping.div(byMerchant.size),
            discount_amount: discount,
            tax_amount: tax,
            total_amount: subOrderTotal,
            commission_rate: rate,
            commission_amount,
          },
        });

        await createCommissionForSubOrder(
          tx,
          subOrder.id,
          merchantId,
          rate,
          subOrderSubtotal,
          commission_amount,
        );

        for (const line of lines) {
          const v = variantMap.get(line.variantId)!;
          const unit = new Prisma.Decimal(line.price);
          const lineTotal = unit.mul(line.quantity);
          await tx.orderItem.create({
            data: {
              sub_order_id: subOrder.id,
              product_id: line.productId,
              variant_id: line.variantId,
              name_ar: line.product_name_ar,
              name_en: line.product_name_en,
              sku: line.sku,
              quantity: line.quantity,
              unit_price: unit,
              total_price: lineTotal,
            },
          });

          const afterVariant = await tx.productVariant.findUnique({
            where: { id: line.variantId },
            select: { stock_quantity: true },
          });
          const qtyAfter = afterVariant?.stock_quantity ?? 0;
          const qtyBefore = qtyAfter + line.quantity;

          await tx.inventoryLog.create({
            data: {
              variant_id: line.variantId,
              merchant_id: merchantId,
              action: InventoryAction.sale,
              actor_role: 'system',
              quantity_change: -line.quantity,
              quantity_before: qtyBefore,
              quantity_after: qtyAfter,
              reference_type: 'order',
              reference_id: String(created.id),
              notes: `COD checkout ${orderNumber}`,
              created_by: userId,
            },
          });
        }
      }

      return created;
    });

    await deleteCart(ctx);

    return {
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_method: order.payment_method,
      total_amount: order.total_amount.toFixed(2),
    };
  } finally {
    await releaseCheckoutLock(ctx.cartId);
  }
}
