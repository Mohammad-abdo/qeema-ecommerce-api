import { BusinessType } from '@prisma/client';
import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const registerBodySchema = z
  .object({
    name: z.string().min(2).max(255),
    email: z.string().email(),
    password: z.string().min(8),
    accountType: z.enum(['customer', 'merchant']).default('customer'),
    store_name: z.string().min(2).max(255).optional(),
    store_slug: z
      .string()
      .min(2)
      .max(128)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    business_type: z.nativeEnum(BusinessType).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType !== 'merchant') return;
    if (!data.store_name) {
      ctx.addIssue({ code: 'custom', message: 'Store name is required', path: ['store_name'] });
    }
    if (!data.store_slug) {
      ctx.addIssue({ code: 'custom', message: 'Store slug is required', path: ['store_slug'] });
    }
  });

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const oauthBodySchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple']),
  token: z.string().min(10),
  /** Apple only: name from first authorization (Apple sends once). */
  name: z.string().min(1).max(255).optional(),
});

export type OAuthBody = z.infer<typeof oauthBodySchema>;
