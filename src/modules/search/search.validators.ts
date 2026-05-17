import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const adminSearchIndexListQuerySchema = paginationQuerySchema.extend({
  merchantId: z.coerce.number().int().positive().optional(),
  search: z.string().max(200).optional(),
  entityType: z.string().max(64).optional(),
});

export type AdminSearchIndexListQuery = z.infer<typeof adminSearchIndexListQuerySchema>;
