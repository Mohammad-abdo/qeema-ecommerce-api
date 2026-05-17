import type { PrismaClient } from '@prisma/client';

import type { SeedCatalog, SeedMerchants, SeedUsers, SeedWarehouse } from './types.ts';

export async function seedSupport(
  prisma: PrismaClient,
  users: SeedUsers,
  merchants: SeedMerchants,
  catalog: SeedCatalog,
  warehouse: SeedWarehouse,
) {
  const ticket = await prisma.supportTicket.create({
    data: {
      ticket_number: 'TKT-SEED-001',
      customer_id: users.customerId,
      merchant_id: merchants.merchantId,
      assigned_to: users.adminId,
      category: 'order',
      status: 'in_progress',
      priority: 'medium',
      subject: 'Where is my package?',
      description: 'Demo support ticket body',
      last_reply_at: new Date(),
    },
  });

  await prisma.supportMessage.create({
    data: {
      ticket_id: ticket.id,
      sender_id: users.customerId,
      sender_type: 'customer',
      message: 'Hello, can you check order ORD-SEED-001?',
    },
  });

  await prisma.supportMessage.create({
    data: {
      ticket_id: ticket.id,
      sender_id: users.adminId,
      sender_type: 'admin',
      message: 'We are checking with the merchant now.',
    },
  });

  await prisma.inventoryLog.create({
    data: {
      variant_id: catalog.variantId,
      merchant_id: merchants.merchantId,
      warehouse_id: warehouse.warehouseId,
      action: 'adjustment',
      actor_role: 'support_user',
      quantity_change: -1,
      quantity_before: 100,
      quantity_after: 99,
      notes: 'Adjustment linked to support ticket',
      support_ticket_id: ticket.id,
      created_by: users.adminId,
    },
  });
}
