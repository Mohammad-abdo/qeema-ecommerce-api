import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

import type { CreateStoryBody, PatchStoryBody } from './storefront.validators.js';

export async function listStorefrontStoriesAdmin() {
  return prisma.storefrontStory.findMany({
    orderBy: { sort_order: 'asc' },
    include: { items: { orderBy: { sort_order: 'asc' } } },
  });
}

export async function createStorefrontStory(body: CreateStoryBody) {
  return prisma.storefrontStory.create({
    data: {
      vendor_name: body.vendor_name,
      vendor_name_tr: body.vendor_name_tr ?? undefined,
      vendor_name_ar: body.vendor_name_ar ?? undefined,
      merchant_id: body.merchant_id ?? undefined,
      is_active: body.is_active,
      is_admin: body.is_admin,
      link_type: body.link_type,
      sort_order: body.sort_order,
      items: body.items?.length
        ? {
            create: body.items.map((item) => ({
              thumbnail: item.thumbnail ?? undefined,
              media_url: item.media_url,
              media_type: item.media_type,
              duration: item.duration,
              link_type: item.link_type,
              link_id: item.link_id ?? undefined,
              sort_order: item.sort_order,
              is_active: item.is_active,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });
}

export async function patchStorefrontStory(id: number, body: PatchStoryBody) {
  const existing = await prisma.storefrontStory.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Story not found', 'NOT_FOUND');

  return prisma.storefrontStory.update({
    where: { id },
    data: {
      ...(body.vendor_name != null ? { vendor_name: body.vendor_name } : {}),
      ...(body.vendor_name_tr !== undefined ? { vendor_name_tr: body.vendor_name_tr } : {}),
      ...(body.vendor_name_ar !== undefined ? { vendor_name_ar: body.vendor_name_ar } : {}),
      ...(body.merchant_id !== undefined ? { merchant_id: body.merchant_id } : {}),
      ...(body.is_active != null ? { is_active: body.is_active } : {}),
      ...(body.is_admin != null ? { is_admin: body.is_admin } : {}),
      ...(body.link_type != null ? { link_type: body.link_type } : {}),
      ...(body.sort_order != null ? { sort_order: body.sort_order } : {}),
    },
    include: { items: true },
  });
}

export async function deleteStorefrontStory(id: number) {
  const existing = await prisma.storefrontStory.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Story not found', 'NOT_FOUND');
  await prisma.storefrontStory.delete({ where: { id } });
}
