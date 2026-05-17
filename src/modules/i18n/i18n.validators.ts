import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const translationsQuerySchema = z.object({
  namespace: z.string().min(1).max(128),
  locale: z.string().min(2).max(32),
});

export type TranslationsQuery = z.infer<typeof translationsQuerySchema>;

export const adminI18nKeysQuerySchema = paginationQuerySchema.extend({
  namespaceSlug: z.string().min(1).max(128),
  search: z.string().max(200).optional(),
});

export type AdminI18nKeysQuery = z.infer<typeof adminI18nKeysQuerySchema>;

export const adminUpsertTranslationBodySchema = z.object({
  namespaceSlug: z.string().min(1).max(128),
  localeCode: z.string().min(2).max(32),
  key: z.string().min(1).max(512),
  value: z.string().min(0).max(100000),
});

export type AdminUpsertTranslationBody = z.infer<typeof adminUpsertTranslationBodySchema>;
