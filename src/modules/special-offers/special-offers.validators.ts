import { SpecialOfferStatus } from '@prisma/client';
import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

const slugSchema = z.string().min(2).max(128).regex(/^[a-z0-9-]+$/);

const offerItemSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  variant_id: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  sort_order: z.coerce.number().int().min(0).optional(),
});

export const specialOfferListQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(SpecialOfferStatus).optional(),
  merchant_id: z.coerce.number().int().positive().optional(),
  search: z.string().max(200).optional(),
});

export type SpecialOfferListQuery = z.infer<typeof specialOfferListQuerySchema>;

export const publicSpecialOfferListQuerySchema = paginationQuerySchema.extend({
  featured: z.coerce.boolean().optional(),
  merchant_id: z.coerce.number().int().positive().optional(),
});

export type PublicSpecialOfferListQuery = z.infer<typeof publicSpecialOfferListQuerySchema>;

const offerBodyBase = z.object({
  title_en: z.string().min(2).max(255),
  title_ar: z.string().min(2).max(255),
  slug: slugSchema.optional(),
  description_en: z.string().max(10000).optional().nullable(),
  description_ar: z.string().max(10000).optional().nullable(),
  image_url: z.string().url().max(2000).optional().nullable(),
  bundle_price: z.coerce.number().positive().max(99999999),
  status: z.nativeEnum(SpecialOfferStatus).optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  starts_at: z.coerce.date().optional().nullable(),
  ends_at: z.coerce.date().optional().nullable(),
  items: z.array(offerItemSchema).min(2).max(20),
});

export const createSpecialOfferAdminBodySchema = offerBodyBase.extend({
  merchant_id: z.coerce.number().int().positive(),
});

export type CreateSpecialOfferAdminBody = z.infer<typeof createSpecialOfferAdminBodySchema>;

export const createSpecialOfferMerchantBodySchema = offerBodyBase;

export type CreateSpecialOfferMerchantBody = z.infer<typeof createSpecialOfferMerchantBodySchema>;

export const patchSpecialOfferBodySchema = offerBodyBase
  .partial()
  .extend({
    items: z.array(offerItemSchema).min(2).max(20).optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

export type PatchSpecialOfferBody = z.infer<typeof patchSpecialOfferBodySchema>;

export const specialOfferIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const specialOfferSlugParamSchema = z.object({
  slug: z.string().min(1).max(128),
});
