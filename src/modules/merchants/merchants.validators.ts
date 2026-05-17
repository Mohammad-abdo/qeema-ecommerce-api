import { BusinessType, MerchantStatus } from '@prisma/client';
import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const merchantListQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(MerchantStatus).optional(),
  search: z.string().max(200).optional(),
});

export type MerchantListQuery = z.infer<typeof merchantListQuerySchema>;

export const merchantIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const slugSchema = z.string().min(2).max(128).regex(/^[a-z0-9-]+$/);

export const publicMerchantListQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
});

export type PublicMerchantListQuery = z.infer<typeof publicMerchantListQuerySchema>;

export const createMerchantAdminBodySchema = z.object({
  owner_email: z.string().email().max(255),
  owner_name: z.string().min(2).max(255),
  owner_password: z.string().min(8).max(128).optional(),
  store_name: z.string().min(2).max(255),
  store_slug: slugSchema,
  store_description: z.string().max(10000).optional(),
  store_logo: z.string().url().max(2000).optional().nullable(),
  store_banner: z.string().url().max(2000).optional().nullable(),
  business_type: z.nativeEnum(BusinessType).default('company'),
  tax_number: z.string().max(64).optional().nullable(),
  commercial_register: z.string().max(64).optional().nullable(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  is_featured: z.boolean().optional(),
  status: z.nativeEnum(MerchantStatus).default('approved'),
});

export type CreateMerchantAdminBody = z.infer<typeof createMerchantAdminBodySchema>;

export const patchMerchantAdminBodySchema = z
  .object({
    store_name: z.string().min(2).max(255).optional(),
    store_slug: slugSchema.optional(),
    store_description: z.string().max(10000).optional().nullable(),
    store_logo: z.string().url().max(2000).optional().nullable(),
    store_banner: z.string().url().max(2000).optional().nullable(),
    business_type: z.nativeEnum(BusinessType).optional(),
    tax_number: z.string().max(64).optional().nullable(),
    commercial_register: z.string().max(64).optional().nullable(),
    commission_rate: z.coerce.number().min(0).max(100).optional(),
    is_featured: z.boolean().optional(),
    status: z.nativeEnum(MerchantStatus).optional(),
    suspension_reason: z.string().max(2000).optional(),
    rejection_reason: z.string().max(2000).optional(),
  })
  .refine(
    (b) =>
      Object.values(b).some((v) => v !== undefined),
    { message: 'At least one field is required' },
  );

export type PatchMerchantAdminBody = z.infer<typeof patchMerchantAdminBodySchema>;

const socialLinksSchema = z
  .object({
    website: z.string().url().max(500).optional().nullable(),
    instagram: z.string().max(255).optional().nullable(),
    facebook: z.string().max(255).optional().nullable(),
    twitter: z.string().max(255).optional().nullable(),
    tiktok: z.string().max(255).optional().nullable(),
  })
  .optional()
  .nullable();

export const patchMyMerchantBodySchema = z
  .object({
    store_name: z.string().min(2).max(255).optional(),
    store_slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/).optional(),
    store_description: z.string().max(10000).optional().nullable(),
    store_logo: z.string().url().max(2000).nullish(),
    store_banner: z.string().url().max(2000).nullish(),
    tax_number: z.string().max(64).optional().nullable(),
    commercial_register: z.string().max(64).optional().nullable(),
    return_policy: z.string().max(50000).optional().nullable(),
    shipping_policy: z.string().max(50000).optional().nullable(),
    privacy_policy: z.string().max(50000).optional().nullable(),
    terms_policy: z.string().max(50000).optional().nullable(),
    contact_phone: z.string().max(32).optional().nullable(),
    contact_whatsapp: z.string().max(32).optional().nullable(),
    contact_email: z.string().email().max(255).optional().nullable(),
    contact_address: z.string().max(2000).optional().nullable(),
    social_links: socialLinksSchema,
  })
  .refine(
    (b) => Object.values(b).some((v) => v !== undefined),
    { message: 'At least one field is required' },
  );

export type PatchMyMerchantBody = z.infer<typeof patchMyMerchantBodySchema>;
