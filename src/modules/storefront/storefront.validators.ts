import { z } from 'zod';

export const createStoryBodySchema = z.object({
  vendor_name: z.string().min(1).max(200),
  vendor_name_tr: z.string().max(200).optional().nullable(),
  vendor_name_ar: z.string().max(200).optional().nullable(),
  merchant_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
  is_admin: z.boolean().default(false),
  link_type: z.string().max(50).default('product'),
  sort_order: z.coerce.number().int().min(0).default(0),
  items: z
    .array(
      z.object({
        thumbnail: z.string().url().max(2000).optional().nullable(),
        media_url: z.string().url().max(2000),
        media_type: z.string().max(20).default('image'),
        duration: z.coerce.number().int().min(1).max(120).default(5),
        link_type: z.string().max(50).default('product'),
        link_id: z.string().max(200).optional().nullable(),
        sort_order: z.coerce.number().int().min(0).default(0),
        is_active: z.boolean().default(true),
      }),
    )
    .optional(),
});

export type CreateStoryBody = z.infer<typeof createStoryBodySchema>;

export const patchStoryBodySchema = createStoryBodySchema.partial().refine((b) => Object.keys(b).length > 0, {
  message: 'At least one field is required',
});

export type PatchStoryBody = z.infer<typeof patchStoryBodySchema>;

export const storyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
