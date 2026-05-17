import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { merchantIdForUser } from '../../lib/merchant-scope.js';

import type { PaginationQuery } from '../../lib/pagination.js';

import type {
  CreateSiteListingBody,
  ReviewSiteListingBody,
  SiteListingAdminListQuery,
  SiteListingMerchantListQuery,
} from './site_listings.validators.js';

export async function listPublishedSiteListings(pagination: PaginationQuery, categoryId?: number) {
  const skip = (pagination.page - 1) * pagination.limit;
  const where = {
    deleted_at: null,
    status: 'published' as const,
    ...(categoryId ? { category_id: categoryId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.siteListing.findMany({
      where,
      orderBy: { published_at: 'desc' },
      skip,
      take: pagination.limit,
      include: { category: true, merchant: { select: { id: true, store_name: true, store_slug: true } } },
    }),
    prisma.siteListing.count({ where }),
  ]);
  return { items, total, page: pagination.page, limit: pagination.limit };
}

export async function listSiteListingsAdmin(q: SiteListingAdminListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.SiteListingWhereInput = { deleted_at: null };
  if (q.status) where.status = q.status;
  if (q.merchantId) where.merchant_id = q.merchantId;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }
  if (q.search) {
    where.OR = [{ title: { contains: q.search } }, { body: { contains: q.search } }];
  }
  const [items, total] = await Promise.all([
    prisma.siteListing.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
      include: {
        category: true,
        merchant: { select: { id: true, store_name: true } },
        author: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.siteListing.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function listSiteListingsForMerchant(userId: number, q: SiteListingMerchantListQuery) {
  const mid = await merchantIdForUser(userId);
  if (!mid) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.SiteListingWhereInput = { deleted_at: null, merchant_id: mid };
  if (q.status) where.status = q.status;
  if (q.from || q.to) {
    where.created_at = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }
  if (q.search) {
    where.OR = [{ title: { contains: q.search } }, { body: { contains: q.search } }];
  }
  const [items, total] = await Promise.all([
    prisma.siteListing.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
      include: { category: true },
    }),
    prisma.siteListing.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function createSiteListing(userId: number, role: string, body: CreateSiteListingBody) {
  const publisherType = role === 'merchant' ? 'merchant' : 'admin';
  const merchantId =
    publisherType === 'merchant' ? (await merchantIdForUser(userId)) ?? undefined : undefined;
  if (publisherType === 'merchant' && !merchantId) {
    throw new AppError(400, 'Merchant profile required', 'BAD_REQUEST');
  }
  return prisma.siteListing.create({
    data: {
      category_id: body.categoryId,
      merchant_id: merchantId ?? null,
      created_by_user_id: userId,
      publisher_type: publisherType,
      title: body.title,
      body: body.body,
      price: body.price != null ? new Prisma.Decimal(body.price) : undefined,
      currency: body.currency,
      location_label: body.locationLabel,
      contact_phone: body.contactPhone,
      contact_email: body.contactEmail,
      status: 'pending_review',
    },
  });
}

export async function reviewSiteListing(
  reviewerId: number,
  listingId: number,
  body: ReviewSiteListingBody,
) {
  const listing = await prisma.siteListing.findFirst({
    where: { id: listingId, deleted_at: null },
  });
  if (!listing) throw new AppError(404, 'Listing not found', 'NOT_FOUND');
  if (listing.status !== 'pending_review') {
    throw new AppError(400, 'Listing is not awaiting review', 'BAD_REQUEST');
  }
  const now = new Date();
  if (body.status === 'published') {
    return prisma.siteListing.update({
      where: { id: listingId },
      data: {
        status: 'published',
        reviewed_by_user_id: reviewerId,
        reviewed_at: now,
        published_at: now,
        rejection_reason: null,
      },
    });
  }
  return prisma.siteListing.update({
    where: { id: listingId },
    data: {
      status: 'rejected',
      reviewed_by_user_id: reviewerId,
      reviewed_at: now,
      rejection_reason: body.rejectionReason ?? 'Rejected',
    },
  });
}
