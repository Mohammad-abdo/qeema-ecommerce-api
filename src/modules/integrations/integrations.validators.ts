import { z } from 'zod';

export const esyasatgoSyncBodySchema = z.object({
  maxPages: z.coerce.number().int().min(1).max(30).optional().default(5),
});

export type EsyasatgoSyncBody = z.infer<typeof esyasatgoSyncBodySchema>;
