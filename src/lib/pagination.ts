import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Optional filters shared by many list endpoints (extend per module). */
export const listDateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export function offsetFromPagination(p: PaginationQuery): { skip: number; take: number } {
  return { skip: (p.page - 1) * p.limit, take: p.limit };
}
