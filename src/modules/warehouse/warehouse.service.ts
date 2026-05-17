import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';
import { isMerchantRole, isStaffRole } from '../../lib/rbac.js';

import type {
  CreateWarehouseBody,
  CreateWarehouseStockBody,
  PatchWarehouseBody,
  PatchWarehouseStockBody,
  WarehouseListQuery,
} from './warehouse.validators.js';

export async function listWarehousesForUser(userId: number, role: string, q: WarehouseListQuery) {
  const skip = (q.page - 1) * q.limit;
  const base: Prisma.WarehouseWhereInput = { deleted_at: null };
  if (q.isActive !== undefined) base.is_active = q.isActive;
  if (q.merchantId) base.merchant_id = q.merchantId;
  if (q.search) {
    base.OR = [
      { name: { contains: q.search } },
      { code: { contains: q.search } },
      { city: { contains: q.search } },
    ];
  }
  if (q.from || q.to) {
    base.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }

  let where: Prisma.WarehouseWhereInput = base;
  if (isStaffRole(role)) {
    where = base;
  } else if (isMerchantRole(role)) {
    const mid = await merchantIdForUser(userId);
    where = { ...base, merchant_id: mid ?? -1, owner_type: 'merchant' };
    if (q.merchantId && mid && q.merchantId !== mid) {
      where = { ...base, id: -1 };
    }
  } else {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }

  const [items, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
      include: { stocks: { take: 20 }, merchant: { select: { id: true, store_name: true } } },
    }),
    prisma.warehouse.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

async function getOwnedWarehouse(merchantUserId: number, warehouseId: number) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  const w = await prisma.warehouse.findFirst({
    where: { id: warehouseId, merchant_id: mid, deleted_at: null, owner_type: 'merchant' },
  });
  if (!w) throw new AppError(404, 'Warehouse not found', 'NOT_FOUND');
  return w;
}

export async function createWarehouse(merchantUserId: number, body: CreateWarehouseBody) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  try {
    return await prisma.warehouse.create({
      data: {
        owner_type: 'merchant',
        merchant_id: mid,
        name: body.name,
        code: body.code,
        description: body.description ?? undefined,
        country: body.country ?? undefined,
        city: body.city ?? undefined,
        address_line: body.address_line ?? undefined,
        is_default: body.is_default ?? false,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Warehouse code conflict', 'CONFLICT');
    }
    throw e;
  }
}

export async function updateWarehouse(merchantUserId: number, warehouseId: number, body: PatchWarehouseBody) {
  await getOwnedWarehouse(merchantUserId, warehouseId);
  try {
    return await prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        ...(body.name != null ? { name: body.name } : {}),
        ...(body.code != null ? { code: body.code } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.country !== undefined ? { country: body.country } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.address_line !== undefined ? { address_line: body.address_line } : {}),
        ...(body.is_default != null ? { is_default: body.is_default } : {}),
        ...(body.is_active != null ? { is_active: body.is_active } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Warehouse code conflict', 'CONFLICT');
    }
    throw e;
  }
}

export async function deleteWarehouse(merchantUserId: number, warehouseId: number) {
  await getOwnedWarehouse(merchantUserId, warehouseId);
  return prisma.warehouse.update({
    where: { id: warehouseId },
    data: { deleted_at: new Date(), is_active: false },
  });
}

async function assertVariantBelongsToMerchant(variantId: number, merchantId: number) {
  const v = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      deleted_at: null,
      product: { merchant_id: merchantId, deleted_at: null },
    },
  });
  if (!v) throw new AppError(400, 'Variant does not belong to your catalog', 'BAD_REQUEST');
}

export async function createWarehouseStock(
  merchantUserId: number,
  warehouseId: number,
  body: CreateWarehouseStockBody,
) {
  const w = await getOwnedWarehouse(merchantUserId, warehouseId);
  const mid = w.merchant_id;
  if (!mid) throw new AppError(400, 'Invalid warehouse', 'BAD_REQUEST');
  await assertVariantBelongsToMerchant(body.variant_id, mid);
  try {
    return await prisma.warehouseStock.create({
      data: {
        warehouse_id: warehouseId,
        variant_id: body.variant_id,
        quantity_on_hand: body.quantity_on_hand,
        quantity_reserved: body.quantity_reserved,
        reorder_point: body.reorder_point ?? undefined,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Stock row already exists for this variant', 'CONFLICT');
    }
    throw e;
  }
}

async function getOwnedStock(merchantUserId: number, stockId: number) {
  const mid = await merchantIdForUser(merchantUserId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  const row = await prisma.warehouseStock.findFirst({
    where: {
      id: stockId,
      warehouse: { merchant_id: mid, deleted_at: null, owner_type: 'merchant' },
    },
    include: { warehouse: true },
  });
  if (!row) throw new AppError(404, 'Stock row not found', 'NOT_FOUND');
  return row;
}

export async function updateWarehouseStock(
  merchantUserId: number,
  stockId: number,
  body: PatchWarehouseStockBody,
) {
  await getOwnedStock(merchantUserId, stockId);
  return prisma.warehouseStock.update({
    where: { id: stockId },
    data: {
      ...(body.quantity_on_hand != null ? { quantity_on_hand: body.quantity_on_hand } : {}),
      ...(body.quantity_reserved != null ? { quantity_reserved: body.quantity_reserved } : {}),
      ...(body.quantity_damaged != null ? { quantity_damaged: body.quantity_damaged } : {}),
      ...(body.reorder_point !== undefined ? { reorder_point: body.reorder_point } : {}),
    },
  });
}

export async function deleteWarehouseStock(merchantUserId: number, stockId: number) {
  const row = await getOwnedStock(merchantUserId, stockId);
  return prisma.warehouseStock.delete({ where: { id: row.id } });
}
