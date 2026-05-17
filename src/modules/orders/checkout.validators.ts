import { z } from 'zod';

export const checkoutBodySchema = z.object({
  address_id: z.coerce.number().int().positive(),
  payment_method: z.literal('cod'),
  coupon_code: z.string().max(64).optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
