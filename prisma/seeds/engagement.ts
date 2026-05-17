import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { SeedCatalog, SeedCommerce, SeedMerchants, SeedUsers } from './types.ts';

export async function seedEngagement(
  prisma: PrismaClient,
  users: SeedUsers,
  merchants: SeedMerchants,
  catalog: SeedCatalog,
  commerce: SeedCommerce,
) {
  const cart = await prisma.cart.create({
    data: { customer_id: users.customerId },
  });

  await prisma.cartItem.create({
    data: {
      cart_id: cart.id,
      variant_id: catalog.variantId,
      quantity: 1,
    },
  });

  await prisma.wishlist.create({
    data: {
      customer_id: users.customerId,
      product_id: catalog.productId,
    },
  });

  const review = await prisma.productReview.create({
    data: {
      product_id: catalog.productId,
      customer_id: users.customerId,
      order_item_id: commerce.orderItemId,
      rating: 5,
      title: 'Great sound',
      comment: 'Demo review',
      status: 'approved',
    },
  });

  await prisma.reviewHelpful.create({
    data: {
      review_id: review.id,
      user_id: users.adminId,
      is_helpful: true,
    },
  });

  await prisma.storeReview.create({
    data: {
      merchant_id: merchants.merchantId,
      customer_id: users.customerId,
      rating: 5,
      comment: 'Fast shipping',
      status: 'approved',
    },
  });

  await prisma.loyaltyTier.create({
    data: {
      name: 'bronze',
      min_points: 0,
      discount_percent: new Prisma.Decimal(0),
    },
  });

  await prisma.loyaltyPoint.create({
    data: {
      customer_id: users.customerId,
      action: 'earned',
      points: 50,
      reference_type: 'order',
      reference_id: String(commerce.orderId),
    },
  });
}
