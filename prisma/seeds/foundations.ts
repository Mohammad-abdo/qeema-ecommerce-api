import type { PrismaClient } from '@prisma/client';

import type { SeedFoundations } from './types.ts';

export async function seedFoundations(prisma: PrismaClient): Promise<SeedFoundations> {
  const en = await prisma.locale.create({
    data: {
      code: 'en',
      name: 'English',
      native_name: 'English',
      direction: 'ltr',
      is_active: true,
      is_default: true,
    },
  });

  const ar = await prisma.locale.create({
    data: {
      code: 'ar',
      name: 'Arabic',
      native_name: 'العربية',
      direction: 'rtl',
      is_active: true,
      is_default: false,
    },
  });

  await prisma.localeFallback.create({
    data: {
      locale_id: ar.id,
      fallback_locale_id: en.id,
      priority: 0,
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: 'platform.name',
      value: { value: 'ERP Demo' },
      description: 'Display name',
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: 'storefront.branding',
      value: {
        logo_url: null,
        site_name: 'Esyasatgo',
        favicon_url: null,
      },
      description: 'Storefront logo, site name, and favicon',
    },
  });

  await prisma.featureFlag.create({
    data: {
      key: 'site_listings.enabled',
      name: 'Site listings',
      description: 'Classified listings module',
      enabled: true,
    },
  });

  return { localeEnId: en.id, localeArId: ar.id };
}
