import type { PrismaClient } from '@prisma/client';

import type { SeedCatalog, SeedFoundations, SeedMerchants, SeedUsers } from './types.ts';

export async function seedI18nSample(
  prisma: PrismaClient,
  users: SeedUsers,
  foundations: SeedFoundations,
  merchants: SeedMerchants,
  catalog: SeedCatalog,
) {
  const ns = await prisma.translationNamespace.create({
    data: {
      slug: 'platform',
      name: 'Platform strings',
      is_system: true,
    },
  });

  const tkey = await prisma.translationKey.create({
    data: {
      namespace_id: ns.id,
      key: 'common.welcome',
      default_value: 'Welcome',
    },
  });

  await prisma.translation.create({
    data: {
      translation_key_id: tkey.id,
      locale_id: foundations.localeEnId,
      value: 'Welcome to the ERP demo',
      status: 'published',
      published_by: users.adminId,
    },
  });

  await prisma.translation.create({
    data: {
      translation_key_id: tkey.id,
      locale_id: foundations.localeArId,
      value: 'مرحباً بك في عرض ERP',
      status: 'published',
      published_by: users.adminId,
    },
  });

  await prisma.translationPermission.create({
    data: {
      user_id: users.adminId,
      namespace_id: ns.id,
      permission: 'namespace_write',
    },
  });

  await prisma.entityTranslation.create({
    data: {
      merchant_id: merchants.merchantId,
      entity_type: 'product',
      entity_id: String(catalog.productId),
      field_path: 'name',
      locale_id: foundations.localeArId,
      value: 'اسم عربي تجريبي',
      author_id: users.merchantUserId,
    },
  });
}
