import { SiteListingStatus } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const siteListingAdminListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    status: z.nativeEnum(SiteListingStatus).optional(),
    merchantId: z.coerce.number().int().positive().optional(),
    search: z.string().max(200).optional(),
  });

export type SiteListingAdminListQuery = z.infer<typeof siteListingAdminListQuerySchema>;

export const siteListingMerchantListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    status: z.nativeEnum(SiteListingStatus).optional(),
    search: z.string().max(200).optional(),
  });

export type SiteListingMerchantListQuery = z.infer<typeof siteListingMerchantListQuerySchema>;

export const createSiteListingBodySchema = z.object({
  categoryId: z.number().int().positive(),
  title: z.string().min(3).max(255),
  body: z.string().min(10),
  price: z.number().optional(),
  currency: z.string().length(3).optional(),
  locationLabel: z.string().max(255).optional(),
  contactPhone: z.string().max(32).optional(),
  contactEmail: z.string().email().optional(),
});

export const reviewSiteListingBodySchema = z.object({
  status: z.enum(['published', 'rejected']),
  rejectionReason: z.string().max(2000).optional(),
});

export const siteListingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateSiteListingBody = z.infer<typeof createSiteListingBodySchema>;
export type ReviewSiteListingBody = z.infer<typeof reviewSiteListingBodySchema>;
