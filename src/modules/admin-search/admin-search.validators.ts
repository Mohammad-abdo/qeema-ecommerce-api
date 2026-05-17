import { z } from 'zod';

export const adminSearchQuerySchema = z.object({
  q: z.string().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AdminSearchQuery = z.infer<typeof adminSearchQuerySchema>;
