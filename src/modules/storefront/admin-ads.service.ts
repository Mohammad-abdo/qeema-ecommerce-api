import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

type AdTargeting = {
  placement?: 'banner' | 'popup';
  trigger?: 'home' | 'scroll';
  duration_seconds?: number;
  media_type?: 'image' | 'video';
  title?: string;
  description?: string;
  tags?: string[];
};

function parseTargeting(raw: unknown): AdTargeting {
  if (!raw || typeof raw !== 'object') return { placement: 'banner' };
  const t = raw as AdTargeting;
  return {
    placement: t.placement ?? 'banner',
    trigger: t.trigger,
    duration_seconds: t.duration_seconds,
    media_type: t.media_type,
    title: t.title,
    description: t.description,
    tags: Array.isArray(t.tags) ? t.tags : [],
  };
}

export async function listBannerCampaignsAdmin(placement: 'banner' | 'popup' = 'banner') {
  const rows = await prisma.adCampaign.findMany({
    where: { type: 'homepage_banner' },
    orderBy: { id: 'desc' },
    include: {
      merchant: { select: { id: true, store_name: true } },
      items: { orderBy: { id: 'asc' } },
    },
  });
  return rows.filter((c) => {
    const t = parseTargeting(c.targeting);
    const p = t.placement ?? 'banner';
    return p === placement;
  });
}

export async function createBannerCampaignAdmin(body: {
  merchant_id: number;
  banner_image: string;
  banner_link?: string;
  banner_position?: 'hero' | 'sidebar' | 'footer';
  budget?: number;
  starts_at?: string;
  ends_at?: string;
  placement?: 'banner' | 'popup';
  trigger?: 'home' | 'scroll';
  duration_seconds?: number;
  media_type?: 'image' | 'video';
  title?: string;
  description?: string;
  tags?: string[];
  product_id?: number | null;
  status?: 'active' | 'draft' | 'paused';
}) {
  const merchant = await prisma.merchant.findFirst({
    where: { id: body.merchant_id, deleted_at: null },
    select: { id: true },
  });
  if (!merchant) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');

  const placement = body.placement ?? 'banner';
  const starts = body.starts_at ? new Date(body.starts_at) : new Date();
  const ends = body.ends_at
    ? new Date(body.ends_at)
    : new Date(starts.getTime() + 30 * 24 * 60 * 60 * 1000);

  let productId: number | null = body.product_id ?? null;
  let bannerLink = body.banner_link ?? '/products';

  if (productId != null) {
    const product = await prisma.product.findFirst({
      where: { id: productId, deleted_at: null },
      select: { id: true, slug: true },
    });
    if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
    bannerLink = `/listing/${product.slug}`;
  }

  const tags = (body.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 12);

  const targeting: AdTargeting = {
    placement,
    trigger: body.trigger ?? (placement === 'popup' ? 'home' : undefined),
    duration_seconds: body.duration_seconds ?? (placement === 'popup' ? 10 : undefined),
    media_type: body.media_type ?? (body.banner_image.match(/\.(mp4|webm|mov)(\?|$)/i) ? 'video' : 'image'),
    title: body.title?.trim() || undefined,
    description: body.description?.trim() || undefined,
    tags: tags.length ? tags : undefined,
  };

  const campaignStatus = body.status ?? 'active';

  return prisma.adCampaign.create({
    data: {
      merchant_id: body.merchant_id,
      type: 'homepage_banner',
      status: campaignStatus,
      bidding_type: 'fixed',
      budget: new Prisma.Decimal(body.budget ?? 500),
      starts_at: starts,
      ends_at: ends,
      targeting,
      items: {
        create: {
          item_type: 'banner',
          product_id: productId,
          banner_image: body.banner_image,
          banner_link: bannerLink,
          banner_position: body.banner_position ?? 'hero',
        },
      },
    },
    include: { items: true, merchant: { select: { id: true, store_name: true } } },
  });
}

export async function patchBannerCampaignAdmin(
  id: number,
  body: { status?: 'active' | 'draft' | 'paused' | 'completed' | 'rejected' },
) {
  const row = await prisma.adCampaign.findFirst({ where: { id, type: 'homepage_banner' } });
  if (!row) throw new AppError(404, 'Campaign not found', 'NOT_FOUND');
  return prisma.adCampaign.update({
    where: { id },
    data: { ...(body.status != null ? { status: body.status } : {}) },
    include: { items: true, merchant: { select: { id: true, store_name: true } } },
  });
}

export async function deleteBannerCampaignAdmin(id: number) {
  const row = await prisma.adCampaign.findFirst({ where: { id, type: 'homepage_banner' } });
  if (!row) throw new AppError(404, 'Campaign not found', 'NOT_FOUND');
  await prisma.adCampaign.delete({ where: { id } });
  return { deleted: true };
}

export async function listActivePopupAds() {
  const now = new Date();
  const rows = await prisma.adCampaign.findMany({
    where: {
      type: 'homepage_banner',
      status: 'active',
      starts_at: { lte: now },
      ends_at: { gte: now },
    },
    include: { items: { where: { banner_image: { not: null } }, orderBy: { id: 'asc' }, take: 1 } },
    orderBy: { id: 'desc' },
    take: 5,
  });

  return rows
    .filter((c) => parseTargeting(c.targeting).placement === 'popup')
    .flatMap((c) => {
      const t = parseTargeting(c.targeting);
      const item = c.items[0];
      if (!item?.banner_image) return [];
      return [
        {
          id: c.id,
          image: item.banner_image,
          link: item.banner_link ?? '/products',
          trigger: t.trigger ?? 'home',
          duration_seconds: t.duration_seconds ?? 10,
          media_type: t.media_type ?? 'image',
        },
      ];
    });
}
