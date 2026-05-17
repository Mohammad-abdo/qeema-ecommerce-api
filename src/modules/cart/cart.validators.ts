import { z } from 'zod';

export const addCartItemBodySchema = z.object({
  variant_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>;

export const updateCartItemBodySchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
});

export type UpdateCartItemBody = z.infer<typeof updateCartItemBodySchema>;

export const variantIdParamSchema = z.object({
  variantId: z.coerce.number().int().positive(),
});
