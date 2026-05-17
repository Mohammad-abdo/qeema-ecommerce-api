import { z } from 'zod';

export const valuationBodySchema = z.object({
  mode: z.enum(['quick', 'detailed']).default('quick'),
  locale: z.enum(['en', 'ar', 'tr']).default('en'),
  title: z.string().max(300).optional(),
  brand: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'used']).default('good'),
  categorySlug: z.string().max(255).optional(),
  imageHint: z.string().max(200).optional(),
});

export type ValuationBody = z.infer<typeof valuationBodySchema>;
