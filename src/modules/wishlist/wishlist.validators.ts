import { z } from 'zod';

export const wishlistProductIdParamSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const addWishlistBodySchema = z.object({
  productId: z.number().int().positive().optional(),
  productSlug: z.string().min(1).max(512).optional(),
}).refine((b) => b.productId != null || b.productSlug != null, {
  message: 'productId or productSlug is required',
});

export type AddWishlistBody = z.infer<typeof addWishlistBodySchema>;
