import type { PrismaClient } from '@prisma/client';

import type { SeedCatalog, SeedMerchants, SeedWarehouse } from './types.ts';

export async function seedWarehouse(
  prisma: PrismaClient,
  merchants: SeedMerchants,
  catalog: SeedCatalog,
): Promise<SeedWarehouse> {
  const warehouse = await prisma.warehouse.create({
    data: {
      owner_type: 'merchant',
      merchant_id: merchants.merchantId,
      name: 'Main Hub',
      code: 'WH-DEMO-MAIN',
      country: 'EG',
      city: 'Cairo',
      is_default: true,
      is_active: true,
    },
  });

  await prisma.warehouseStock.createMany({
    data: catalog.catalogItems.map((item, idx) => ({
      warehouse_id: warehouse.id,
      variant_id: item.variantId,
      quantity_on_hand: 20 + (idx % 15) * 5,
      quantity_reserved: 0,
      reorder_point: 5,
    })),
  });

  return { warehouseId: warehouse.id };
}
