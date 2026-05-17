import { z } from 'zod';

export const patchAdminSettingsBodySchema = z
  .object({
    branding: z
      .object({
        logo_url: z.string().max(1024).nullable().optional(),
        site_name: z.string().min(1).max(120).optional(),
        favicon_url: z.string().max(1024).nullable().optional(),
      })
      .optional(),
  })
  .refine((b) => b.branding != null, { message: 'At least one field is required' });

export type PatchAdminSettingsBody = z.infer<typeof patchAdminSettingsBodySchema>;
