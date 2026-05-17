import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

import type { AdminI18nKeysQuery, AdminUpsertTranslationBody, TranslationsQuery } from './i18n.validators.js';

export async function listLocales() {
  return prisma.locale.findMany({
    where: { is_active: true },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      native_name: true,
      direction: true,
      is_default: true,
    },
  });
}

export async function getTranslationsBundle(query: TranslationsQuery) {
  const locale = await prisma.locale.findFirst({ where: { code: query.locale, is_active: true } });
  if (!locale) throw new AppError(404, 'Locale not found', 'NOT_FOUND');

  const ns = await prisma.translationNamespace.findFirst({
    where: { slug: query.namespace, merchant_id: null },
  });
  if (!ns) throw new AppError(404, 'Namespace not found', 'NOT_FOUND');

  const keys = await prisma.translationKey.findMany({
    where: { namespace_id: ns.id },
    include: {
      translations: {
        where: { locale_id: locale.id, status: 'published' },
      },
    },
    take: 500,
  });

  return {
    locale: query.locale,
    namespace: query.namespace,
    entries: keys.map((k) => ({
      key: k.key,
      value: k.translations[0]?.value ?? k.default_value ?? '',
    })),
  };
}

export async function listTranslationKeysAdmin(q: AdminI18nKeysQuery) {
  const skip = (q.page - 1) * q.limit;
  const ns = await prisma.translationNamespace.findFirst({
    where: { slug: q.namespaceSlug, merchant_id: null },
  });
  if (!ns) throw new AppError(404, 'Namespace not found', 'NOT_FOUND');
  const where = {
    namespace_id: ns.id,
    ...(q.search
      ? {
          OR: [{ key: { contains: q.search } }, { default_value: { contains: q.search } }],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.translationKey.findMany({
      where,
      orderBy: { id: 'asc' },
      skip,
      take: q.limit,
      select: { id: true, key: true, default_value: true, description: true },
    }),
    prisma.translationKey.count({ where }),
  ]);
  return { namespaceSlug: q.namespaceSlug, items, total, page: q.page, limit: q.limit };
}

export async function upsertTranslationAdmin(adminId: number, body: AdminUpsertTranslationBody) {
  const ns = await prisma.translationNamespace.findFirst({
    where: { slug: body.namespaceSlug, merchant_id: null },
  });
  if (!ns) throw new AppError(404, 'Namespace not found', 'NOT_FOUND');
  const tk = await prisma.translationKey.findFirst({
    where: { namespace_id: ns.id, key: body.key },
  });
  if (!tk) throw new AppError(404, 'Translation key not found', 'NOT_FOUND');
  const locale = await prisma.locale.findFirst({ where: { code: body.localeCode, is_active: true } });
  if (!locale) throw new AppError(404, 'Locale not found', 'NOT_FOUND');

  const existing = await prisma.translation.findUnique({
    where: {
      translation_key_id_locale_id: { translation_key_id: tk.id, locale_id: locale.id },
    },
  });

  return prisma.translation.upsert({
    where: {
      translation_key_id_locale_id: { translation_key_id: tk.id, locale_id: locale.id },
    },
    create: {
      translation_key_id: tk.id,
      locale_id: locale.id,
      value: body.value,
      status: 'published',
      published_by: adminId,
      published_at: new Date(),
    },
    update: {
      value: body.value,
      published_by: adminId,
      published_at: new Date(),
      version: (existing?.version ?? 0) + 1,
    },
  });
}
