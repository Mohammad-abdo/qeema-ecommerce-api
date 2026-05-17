import { z } from 'zod';

export const merchantSubOrderIdParamSchema = z.object({
  subOrderId: z.coerce.number().int().positive(),
});

export const shipSubOrderBodySchema = z.object({
  tracking_number: z.string().min(1).max(128),
  carrier_code: z.string().max(64).optional(),
  note: z.string().max(500).optional(),
});

export type ShipSubOrderBody = z.infer<typeof shipSubOrderBodySchema>;
