import { Prisma } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { getQueues } from '../../lib/queues.js';

export async function createCommissionForSubOrder(
  tx: Prisma.TransactionClient,
  subOrderId: number,
  merchantId: number,
  rate: Prisma.Decimal,
  grossAmount: Prisma.Decimal,
  commissionAmount: Prisma.Decimal,
) {
  await tx.commission.create({
    data: {
      sub_order_id: subOrderId,
      merchant_id: merchantId,
      rate,
      gross_amount: grossAmount,
      amount: commissionAmount,
      status: 'pending',
    },
  });
}

export async function scheduleCommissionClearing(subOrderId: number) {
  const queues = getQueues();
  if (!queues) {
    console.warn('[commission] Redis unavailable — commission clear job not scheduled for sub-order', subOrderId);
    return;
  }

  const jobId = `commission-clear-${subOrderId}`;
  const existing = await queues.commission.getJob(jobId);
  if (existing) return;

  await queues.commission.add(
    'clear',
    { subOrderId },
    {
      jobId,
      delay: env.COMMISSION_CLEAR_DELAY_MS,
      removeOnComplete: 50,
      attempts: 3,
    },
  );

  await prisma.commission.updateMany({
    where: { sub_order_id: subOrderId, status: 'pending' },
    data: { status: 'clearing' },
  });
}

export async function ensureCommissionForSubOrder(subOrderId: number) {
  const existing = await prisma.commission.findFirst({ where: { sub_order_id: subOrderId } });
  if (existing) return existing;

  const sub = await prisma.subOrder.findFirst({
    where: { id: subOrderId, deleted_at: null },
    select: {
      id: true,
      merchant_id: true,
      subtotal: true,
      commission_rate: true,
      commission_amount: true,
    },
  });
  if (!sub) return null;

  return prisma.commission.create({
    data: {
      sub_order_id: sub.id,
      merchant_id: sub.merchant_id,
      rate: sub.commission_rate,
      gross_amount: sub.subtotal,
      amount: sub.commission_amount,
      status: 'pending',
    },
  });
}

export async function processCommissionClear(subOrderId: number) {
  const commission = await prisma.commission.findFirst({
    where: {
      sub_order_id: subOrderId,
      status: { in: ['pending', 'clearing'] },
    },
    include: { sub_order: true },
  });
  if (!commission) return null;
  if (commission.status === 'cleared' || commission.status === 'paid') {
    return commission;
  }

  const merchantEarnings = new Prisma.Decimal(commission.gross_amount).sub(commission.amount);
  if (merchantEarnings.lessThan(0)) {
    throw new AppError(400, 'Invalid commission amounts', 'BAD_REQUEST');
  }

  const systemUser = await prisma.user.findFirst({
    where: { role: { in: ['admin', 'super_admin'] }, deleted_at: null },
    select: { id: true },
  });
  const createdBy = systemUser?.id ?? 1;

  return prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findFirst({
      where: { owner_type: 'merchant', owner_id: commission.merchant_id },
    });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { owner_type: 'merchant', owner_id: commission.merchant_id, balance: 0 },
      });
    }
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore.add(merchantEarnings);

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        wallet_id: wallet.id,
        type: 'credit',
        category: 'commission',
        amount: merchantEarnings,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: 'success',
        reference_type: 'sub_order',
        reference_id: String(subOrderId),
        note: `Commission cleared for sub-order #${subOrderId}`,
        created_by: createdBy,
      },
    });

    return tx.commission.update({
      where: { id: commission.id },
      data: { status: 'cleared', cleared_at: new Date() },
    });
  });
}
