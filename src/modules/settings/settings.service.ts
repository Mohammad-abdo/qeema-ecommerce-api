import { prisma } from '../../lib/prisma.js';

export const STOREFRONT_BRANDING_KEY = 'storefront.branding';

export type StorefrontBranding = {
  logo_url: string | null;
  site_name: string;
  favicon_url: string | null;
};

const DEFAULT_BRANDING: StorefrontBranding = {
  logo_url: null,
  site_name: 'Esyasatgo',
  favicon_url: null,
};

function parseBranding(value: unknown): StorefrontBranding {
  if (!value || typeof value !== 'object') return { ...DEFAULT_BRANDING };
  const v = value as Record<string, unknown>;
  return {
    logo_url: typeof v.logo_url === 'string' ? v.logo_url : v.logo_url === null ? null : DEFAULT_BRANDING.logo_url,
    site_name: typeof v.site_name === 'string' && v.site_name.trim() ? v.site_name.trim() : DEFAULT_BRANDING.site_name,
    favicon_url:
      typeof v.favicon_url === 'string' ? v.favicon_url : v.favicon_url === null ? null : DEFAULT_BRANDING.favicon_url,
  };
}

async function getBranding(): Promise<StorefrontBranding> {
  const row = await prisma.systemSetting.findUnique({ where: { key: STOREFRONT_BRANDING_KEY } });
  if (!row) return { ...DEFAULT_BRANDING };
  return parseBranding(row.value);
}

export async function getPublicSettings() {
  const branding = await getBranding();
  return { branding };
}

export async function getAdminSettings() {
  const branding = await getBranding();
  return { branding };
}

export async function patchAdminSettings(body: { branding?: Partial<StorefrontBranding> }) {
  const current = await getBranding();
  const next: StorefrontBranding = {
    logo_url: body.branding?.logo_url !== undefined ? body.branding.logo_url : current.logo_url,
    site_name: body.branding?.site_name?.trim() || current.site_name,
    favicon_url: body.branding?.favicon_url !== undefined ? body.branding.favicon_url : current.favicon_url,
  };
  await prisma.systemSetting.upsert({
    where: { key: STOREFRONT_BRANDING_KEY },
    create: {
      key: STOREFRONT_BRANDING_KEY,
      value: next,
      description: 'Storefront logo, site name, and favicon',
    },
    update: { value: next },
  });
  return { branding: next };
}
