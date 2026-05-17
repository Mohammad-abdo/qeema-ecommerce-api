import type { PrismaClient } from '@prisma/client';

import type { SeedMerchants, SeedUsers } from './types.ts';

export async function seedReports(prisma: PrismaClient, users: SeedUsers, merchants: SeedMerchants) {
  const def = await prisma.reportDefinition.create({
    data: {
      merchant_id: merchants.merchantId,
      owner_user_id: users.merchantUserId,
      name: 'Monthly sales',
      slug: 'monthly-sales-demo',
      category: 'sales',
      resource_type: 'orders',
      spec: { dimensions: ['day'], metrics: ['revenue'] },
      default_format: 'json',
      is_shared: false,
    },
  });

  await prisma.reportRun.create({
    data: {
      report_definition_id: def.id,
      merchant_id: merchants.merchantId,
      requested_by_user_id: users.adminId,
      status: 'completed',
      format: 'json',
      row_count: 42,
      started_at: new Date(),
      completed_at: new Date(),
      parameters: { month: 1, year: 2025 },
    },
  });

  await prisma.reportSchedule.create({
    data: {
      report_definition_id: def.id,
      merchant_id: merchants.merchantId,
      frequency: 'weekly',
      created_by_user_id: users.merchantUserId,
      next_run_at: new Date(Date.now() + 86400000),
    },
  });
}
