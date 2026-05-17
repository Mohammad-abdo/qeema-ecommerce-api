import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { SeedCommerce, SeedMerchants, SeedUsers } from './types.ts';

export async function seedPayments(
  prisma: PrismaClient,
  users: SeedUsers,
  merchants: SeedMerchants,
  commerce: SeedCommerce,
) {
  const order = await prisma.order.findUnique({
    where: { id: commerce.orderId },
    select: { total_amount: true },
  });
  const paidAmount = order?.total_amount ?? new Prisma.Decimal(0);

  await prisma.paymentLog.create({
    data: {
      order_id: commerce.orderId,
      gateway: 'cod',
      event_type: 'payment.confirmed',
      amount: paidAmount,
      currency: 'EGP',
      payload: { source: 'seed' },
      idempotency_key: 'seed-paymentlog-001',
      status: 'success',
      processed_at: new Date(),
    },
  });

  const subOrder = await prisma.subOrder.findFirst({
    where: { order_id: commerce.orderId },
    select: { commission_amount: true },
  });
  const commissionAmt = subOrder?.commission_amount ?? new Prisma.Decimal(0);

  const merchantWallet = await prisma.wallet.create({
    data: {
      owner_type: 'merchant',
      owner_id: merchants.merchantId,
      balance: new Prisma.Decimal(5000).add(commissionAmt),
    },
  });

  const customerWallet = await prisma.wallet.create({
    data: {
      owner_type: 'customer',
      owner_id: users.customerId,
      balance: new Prisma.Decimal(100),
    },
  });

  await prisma.walletTransaction.create({
    data: {
      wallet_id: merchantWallet.id,
      type: 'credit',
      category: 'commission',
      amount: commissionAmt,
      balance_before: new Prisma.Decimal(5000),
      balance_after: new Prisma.Decimal(5000).add(commissionAmt),
      status: 'success',
      created_by: users.adminId,
    },
  });

  await prisma.walletTransaction.create({
    data: {
      wallet_id: customerWallet.id,
      type: 'credit',
      category: 'topup',
      amount: new Prisma.Decimal(100),
      balance_before: new Prisma.Decimal(0),
      balance_after: new Prisma.Decimal(100),
      status: 'success',
      created_by: users.adminId,
    },
  });

  await prisma.payout.create({
    data: {
      merchant_id: merchants.merchantId,
      amount: new Prisma.Decimal(2000),
      method: 'bank_transfer',
      status: 'pending',
      note: 'Demo payout request',
    },
  });
}
