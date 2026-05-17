import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { getStorefrontHome } from './storefront.service.js';
import {
  createBannerCampaignAdmin,
  deleteBannerCampaignAdmin,
  listActivePopupAds,
  listBannerCampaignsAdmin,
  patchBannerCampaignAdmin,
} from './admin-ads.service.js';
import {
  createStorefrontStory,
  deleteStorefrontStory,
  listStorefrontStoriesAdmin,
  patchStorefrontStory,
} from './storefront.admin.service.js';
import {
  createStoryBodySchema,
  patchStoryBodySchema,
  storyIdParamSchema,
} from './storefront.validators.js';

export async function getStorefrontHomeController(_request: FastifyRequest, reply: FastifyReply) {
  const data = await getStorefrontHome();
  return reply.send({ success: true, data });
}

export async function getStorefrontPopupsController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ success: true, data: await listActivePopupAds() });
}

export async function listStorefrontStoriesAdminController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  return reply.send(await listStorefrontStoriesAdmin());
}

export async function createStorefrontStoryController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = createStoryBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createStorefrontStory(parsed.data);
  return reply.code(201).send(row);
}

export async function patchStorefrontStoryController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = storyIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchStoryBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await patchStorefrontStory(params.data.id, parsed.data));
}

export async function listBannerCampaignsAdminController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const placement =
    (request.query as { placement?: string })?.placement === 'popup' ? 'popup' : 'banner';
  return reply.send(await listBannerCampaignsAdmin(placement));
}

export async function createBannerCampaignAdminController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const body = request.body as {
    merchant_id?: number;
    banner_image?: string;
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
  };
  if (!body?.merchant_id || !body?.banner_image) {
    return reply.code(400).send({ message: 'merchant_id and banner_image are required' });
  }
  const row = await createBannerCampaignAdmin({
    merchant_id: body.merchant_id,
    banner_image: body.banner_image,
    banner_link: body.banner_link,
    banner_position: body.banner_position,
    placement: body.placement,
    trigger: body.trigger,
    duration_seconds: body.duration_seconds,
    media_type: body.media_type,
    budget: body.budget,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    title: body.title,
    description: body.description,
    tags: body.tags,
    product_id: body.product_id,
    status: body.status,
  });
  return reply.code(201).send(row);
}

export async function patchBannerCampaignAdminController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const id = Number((request.params as { id: string }).id);
  if (!Number.isFinite(id)) return reply.code(400).send({ message: 'Invalid id' });
  const body = request.body as { status?: 'active' | 'draft' | 'paused' | 'completed' | 'rejected' };
  if (!body?.status) return reply.code(400).send({ message: 'status is required' });
  return reply.send(await patchBannerCampaignAdmin(id, { status: body.status }));
}

export async function deleteBannerCampaignAdminController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const id = Number((request.params as { id: string }).id);
  if (!Number.isFinite(id)) return reply.code(400).send({ message: 'Invalid id' });
  return reply.send(await deleteBannerCampaignAdmin(id));
}

export async function deleteStorefrontStoryController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = storyIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  await deleteStorefrontStory(params.data.id);
  return reply.code(204).send();
}
