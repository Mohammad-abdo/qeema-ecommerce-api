import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const warehouseListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    merchantId: z.coerce.number().int().positive().optional(),
    search: z.string().max(200).optional(),
    isActive: z.coerce.boolean().optional(),
  });

export type WarehouseListQuery = z.infer<typeof warehouseListQuerySchema>;

export const warehouseIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createWarehouseBodySchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(64),
  description: z.string().max(5000).optional().nullable(),
  country: z.string().max(64).optional().nullable(),
  city: z.string().max(128).optional().nullable(),
  address_line: z.string().max(2000).optional().nullable(),
  is_default: z.boolean().optional(),
});

export type CreateWarehouseBody = z.infer<typeof createWarehouseBodySchema>;

export const patchWarehouseBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(64).optional(),
    description: z.string().max(5000).nullable().optional(),
    country: z.string().max(64).nullable().optional(),
    city: z.string().max(128).nullable().optional(),
    address_line: z.string().max(2000).nullable().optional(),
    is_default: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required' });

export type PatchWarehouseBody = z.infer<typeof patchWarehouseBodySchema>;

export const createWarehouseStockBodySchema = z.object({
  variant_id: z.coerce.number().int().positive(),
  quantity_on_hand: z.coerce.number().int().min(0).default(0),
  quantity_reserved: z.coerce.number().int().min(0).default(0),
  reorder_point: z.coerce.number().int().min(0).optional().nullable(),
});

export type CreateWarehouseStockBody = z.infer<typeof createWarehouseStockBodySchema>;

export const patchWarehouseStockBodySchema = z
  .object({
    quantity_on_hand: z.coerce.number().int().min(0).optional(),
    quantity_reserved: z.coerce.number().int().min(0).optional(),
    quantity_damaged: z.coerce.number().int().min(0).optional(),
    reorder_point: z.coerce.number().int().min(0).nullable().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required' });

export type PatchWarehouseStockBody = z.infer<typeof patchWarehouseStockBodySchema>;

export const warehouseStockIdParamSchema = z.object({
  stockId: z.coerce.number().int().positive(),
});
