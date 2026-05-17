import { ProductStatus } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  merchantId: z.coerce.number().int().positive().optional(),
  search: z.string().max(200).optional(),
  category: z.string().max(255).optional(),
  sort: z.enum(['newest', 'views', 'price_asc', 'price_desc']).optional(),
  featured: z.coerce.boolean().optional(),
  flash: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const merchantProductListQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ProductStatus).optional(),
  search: z.string().max(200).optional(),
});

export type MerchantProductListQuery = z.infer<typeof merchantProductListQuerySchema>;

export const adminProductListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    merchantId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    search: z.string().max(200).optional(),
    isApproved: z.coerce.boolean().optional(),
  });

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productVariantParamsSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const variantIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productImageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const moderateProductBodySchema = z
  .object({
    status: z.nativeEnum(ProductStatus).optional(),
    is_approved: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    rejection_reason: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (b) =>
      b.status != null ||
      b.is_approved != null ||
      b.is_featured != null ||
      b.rejection_reason !== undefined,
    { message: 'At least one field is required' },
  );

export type ModerateProductBody = z.infer<typeof moderateProductBodySchema>;

export const createMerchantProductBodySchema = z.object({
  name_ar: z.string().min(1).max(500),
  name_en: z.string().min(1).max(500),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  category_id: z.number().int().positive().optional().nullable(),
  brand_id: z.number().int().positive().optional().nullable(),
  description_ar: z.string().max(20000).optional().nullable(),
  description_en: z.string().max(20000).optional().nullable(),
});

export type CreateMerchantProductBody = z.infer<typeof createMerchantProductBodySchema>;

const variantInputSchema = z.object({
  sku: z.string().min(1).max(100),
  price: z.coerce.number().nonnegative(),
  stock_quantity: z.coerce.number().int().nonnegative().default(0),
  compare_at_price: z.coerce.number().nonnegative().optional(),
});

const productImageInputSchema = z.object({
  image_url: z.string().min(1).max(2000),
  alt_text: z.string().max(500).optional(),
  is_primary: z.boolean().optional(),
});

export const createAdminProductBodySchema = createMerchantProductBodySchema.extend({
  merchant_id: z.number().int().positive(),
  publish: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  variants: z.array(variantInputSchema).min(1),
  images: z.array(productImageInputSchema).optional(),
});

export const createAdminProductImageBodySchema = productImageInputSchema.extend({
  sort_order: z.number().int().min(0).optional(),
});

export type CreateAdminProductBody = z.infer<typeof createAdminProductBodySchema>;

export const patchMerchantProductBodySchema = z
  .object({
    name_ar: z.string().min(1).max(500).optional(),
    name_en: z.string().min(1).max(500).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
    category_id: z.number().int().positive().nullable().optional(),
    brand_id: z.number().int().positive().nullable().optional(),
    description_ar: z.string().max(20000).nullable().optional(),
    description_en: z.string().max(20000).nullable().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required' });

export type PatchMerchantProductBody = z.infer<typeof patchMerchantProductBodySchema>;

export const createVariantBodySchema = z.object({
  sku: z.string().min(1).max(64),
  price: z.coerce.number().nonnegative(),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  compare_at_price: z.coerce.number().nonnegative().optional().nullable(),
  barcode: z.string().max(64).optional().nullable(),
});

export type CreateVariantBody = z.infer<typeof createVariantBodySchema>;

export const patchVariantBodySchema = z
  .object({
    sku: z.string().min(1).max(64).optional(),
    price: z.coerce.number().nonnegative().optional(),
    stock_quantity: z.coerce.number().int().min(0).optional(),
    compare_at_price: z.coerce.number().nonnegative().nullable().optional(),
    is_active: z.boolean().optional(),
    barcode: z.string().max(64).nullable().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required' });

export type PatchVariantBody = z.infer<typeof patchVariantBodySchema>;

export const createProductImageBodySchema = z.object({
  image_url: z.string().url().max(2000),
  alt_text: z.string().max(500).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_primary: z.boolean().default(false),
});

export type CreateProductImageBody = z.infer<typeof createProductImageBodySchema>;
