import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { hashPassword } from '../../lib/password.js';

import type {
  CreateMerchantAdminBody,
  MerchantListQuery,
  PatchMerchantAdminBody,
  PatchMyMerchantBody,
  PublicMerchantListQuery,
} from './merchants.validators.js';

const merchantPublicSelect = {
  id: true,
  store_name: true,
  store_slug: true,
  store_logo: true,
  store_banner: true,
  store_description: true,
  rating: true,
  rating_count: true,
  total_orders: true,
  is_featured: true,
} satisfies Prisma.MerchantSelect;

export async function getMerchantPublicBySlug(slug: string) {
  const m = await prisma.merchant.findFirst({
    where: { store_slug: slug, deleted_at: null, status: 'approved' },
    include: {
      user: { select: { id: true, name: true } },
      settings: true,
    },
  });
  if (!m) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');
  return m;
}

export async function getMyMerchant(userId: number) {
  const m = await prisma.merchant.findUnique({
    where: { user_id: userId },
    include: { settings: true },
  });
  if (!m) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');
  return m;
}

export async function listMerchantsPublic(q: PublicMerchantListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.MerchantWhereInput = {
    deleted_at: null,
    status: 'approved',
  };
  if (q.featured) where.is_featured = true;
  if (q.search) {
    where.OR = [
      { store_name: { contains: q.search } },
      { store_slug: { contains: q.search } },
      { store_description: { contains: q.search } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.merchant.findMany({
      where,
      orderBy: [{ is_featured: 'desc' }, { rating: 'desc' }, { id: 'desc' }],
      skip,
      take: q.limit,
      select: merchantPublicSelect,
    }),
    prisma.merchant.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function getMerchantAdmin(merchantId: number) {
  const m = await prisma.merchant.findFirst({
    where: { id: merchantId, deleted_at: null },
    include: {
      user: { select: { id: true, email: true, name: true } },
      settings: true,
    },
  });
  if (!m) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');
  return m;
}

export async function createMerchantAdmin(body: CreateMerchantAdminBody) {
  const existingUser = await prisma.user.findUnique({ where: { email: body.owner_email } });
  if (existingUser && !existingUser.deleted_at) {
    throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const slugTaken = await prisma.merchant.findFirst({
    where: { store_slug: body.store_slug, deleted_at: null },
  });
  if (slugTaken) throw new AppError(409, 'Store slug already in use', 'SLUG_EXISTS');

  const password_hash = await hashPassword(body.owner_password ?? 'Password123!');

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.owner_email,
          name: body.owner_name,
          password_hash,
          role: 'merchant',
          email_verified_at: new Date(),
        },
      });

      await tx.notificationPreference.create({
        data: { user_id: user.id, order_updates: true, promotions: true, support: true },
      });

      const merchant = await tx.merchant.create({
        data: {
          user_id: user.id,
          store_name: body.store_name,
          store_slug: body.store_slug,
          store_description: body.store_description,
          store_logo: body.store_logo ?? undefined,
          store_banner: body.store_banner ?? undefined,
          business_type: body.business_type,
          tax_number: body.tax_number ?? undefined,
          commercial_register: body.commercial_register ?? undefined,
          commission_rate:
            body.commission_rate != null ? new Prisma.Decimal(body.commission_rate) : new Prisma.Decimal(10),
          is_featured: body.is_featured ?? false,
          status: body.status,
          approved_at: body.status === 'approved' ? new Date() : undefined,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
          settings: true,
        },
      });

      await tx.merchantSettings.create({
        data: {
          merchant_id: merchant.id,
          min_order_amount: new Prisma.Decimal(0),
          auto_confirm_orders: false,
          processing_time_days: 2,
        },
      });

      return tx.merchant.findUniqueOrThrow({
        where: { id: merchant.id },
        include: {
          user: { select: { id: true, email: true, name: true } },
          settings: true,
        },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Email or store slug already in use', 'CONFLICT');
    }
    throw e;
  }
}

export async function listMerchantsAdmin(q: MerchantListQuery) {
  const skip = (q.page - 1) * q.limit;
  const where: Prisma.MerchantWhereInput = { deleted_at: null };
  if (q.status) where.status = q.status;
  if (q.search) {
    where.OR = [
      { store_name: { contains: q.search } },
      { store_slug: { contains: q.search } },
      { user: { email: { contains: q.search } } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.merchant.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: q.limit,
      include: {
        user: { select: { id: true, email: true, name: true } },
        settings: true,
      },
    }),
    prisma.merchant.count({ where }),
  ]);
  return { items, total, page: q.page, limit: q.limit };
}

export async function updateMerchantAdmin(merchantId: number, body: PatchMerchantAdminBody) {
  const m = await prisma.merchant.findFirst({ where: { id: merchantId, deleted_at: null } });
  if (!m) throw new AppError(404, 'Merchant not found', 'NOT_FOUND');

  if (body.store_slug && body.store_slug !== m.store_slug) {
    const slugTaken = await prisma.merchant.findFirst({
      where: { store_slug: body.store_slug, deleted_at: null, id: { not: merchantId } },
    });
    if (slugTaken) throw new AppError(409, 'Store slug already in use', 'SLUG_EXISTS');
  }

  const data: Prisma.MerchantUpdateInput = {};
  if (body.store_name != null) data.store_name = body.store_name;
  if (body.store_slug != null) data.store_slug = body.store_slug;
  if (body.store_description !== undefined) data.store_description = body.store_description;
  if (body.store_logo !== undefined) data.store_logo = body.store_logo;
  if (body.store_banner !== undefined) data.store_banner = body.store_banner;
  if (body.business_type != null) data.business_type = body.business_type;
  if (body.tax_number !== undefined) data.tax_number = body.tax_number;
  if (body.commercial_register !== undefined) data.commercial_register = body.commercial_register;
  if (body.commission_rate != null) data.commission_rate = new Prisma.Decimal(body.commission_rate);
  if (body.is_featured != null) data.is_featured = body.is_featured;

  if (body.status != null) {
    data.status = body.status;
    if (body.status === 'approved') {
      data.approved_at = new Date();
      data.suspended_at = null;
      data.suspension_reason = null;
    }
    if (body.status === 'suspended') {
      data.suspended_at = new Date();
      if (body.suspension_reason) data.suspension_reason = body.suspension_reason;
    }
    if (body.status === 'rejected' && body.rejection_reason) {
      data.rejection_reason = body.rejection_reason;
    }
  } else if (body.suspension_reason != null) {
    data.suspension_reason = body.suspension_reason;
  } else if (body.rejection_reason != null) {
    data.rejection_reason = body.rejection_reason;
  }

  return prisma.merchant.update({
    where: { id: merchantId },
    data,
    include: {
      user: { select: { id: true, email: true, name: true } },
      settings: true,
    },
  });
}

export async function updateMyMerchant(userId: number, body: PatchMyMerchantBody) {
  const m = await prisma.merchant.findUnique({ where: { user_id: userId } });
  if (!m) throw new AppError(404, 'Merchant profile not found', 'NOT_FOUND');

  if (body.store_slug && body.store_slug !== m.store_slug) {
    const slugTaken = await prisma.merchant.findFirst({
      where: { store_slug: body.store_slug, deleted_at: null, id: { not: m.id } },
    });
    if (slugTaken) throw new AppError(409, 'Store slug already in use', 'SLUG_EXISTS');
  }

  const settingsData: Prisma.MerchantSettingsUpdateInput = {};
  if (body.return_policy !== undefined) settingsData.return_policy = body.return_policy;
  if (body.shipping_policy !== undefined) settingsData.shipping_policy = body.shipping_policy;
  if (body.privacy_policy !== undefined) settingsData.privacy_policy = body.privacy_policy;
  if (body.terms_policy !== undefined) settingsData.terms_policy = body.terms_policy;
  if (body.contact_phone !== undefined) settingsData.contact_phone = body.contact_phone;
  if (body.contact_whatsapp !== undefined) settingsData.contact_whatsapp = body.contact_whatsapp;
  if (body.contact_email !== undefined) settingsData.contact_email = body.contact_email;
  if (body.contact_address !== undefined) settingsData.contact_address = body.contact_address;
  if (body.social_links !== undefined) {
    settingsData.social_links =
      body.social_links === null ? Prisma.JsonNull : (body.social_links as Prisma.InputJsonValue);
  }

  const hasSettings = Object.keys(settingsData).length > 0;

  return prisma.merchant.update({
    where: { id: m.id },
    data: {
      ...(body.store_name != null ? { store_name: body.store_name } : {}),
      ...(body.store_slug != null ? { store_slug: body.store_slug } : {}),
      ...(body.store_description !== undefined ? { store_description: body.store_description } : {}),
      ...(body.store_logo !== undefined ? { store_logo: body.store_logo } : {}),
      ...(body.store_banner !== undefined ? { store_banner: body.store_banner } : {}),
      ...(body.tax_number !== undefined ? { tax_number: body.tax_number } : {}),
      ...(body.commercial_register !== undefined ? { commercial_register: body.commercial_register } : {}),
      ...(hasSettings
        ? {
            settings: {
              upsert: {
                create: {
                  ...(settingsData as Prisma.MerchantSettingsCreateInput),
                  min_order_amount: new Prisma.Decimal(0),
                },
                update: settingsData,
              },
            },
          }
        : {}),
    },
    include: { settings: true, user: { select: { id: true, email: true, name: true } } },
  });
}
