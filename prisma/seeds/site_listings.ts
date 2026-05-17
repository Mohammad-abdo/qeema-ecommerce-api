import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { SeedMerchants, SeedUsers } from './types.ts';

export async function seedSiteListings(prisma: PrismaClient, users: SeedUsers, merchants: SeedMerchants) {
  const cat = await prisma.siteListingCategory.create({
    data: {
      slug: 'general',
      name_ar: 'عام',
      name_en: 'General',
      sort_order: 0,
    },
  });

  await prisma.siteListing.create({
    data: {
      category_id: cat.id,
      merchant_id: merchants.merchantId,
      created_by_user_id: users.merchantUserId,
      publisher_type: 'merchant',
      title: 'Bulk USB cables',
      body: 'Selling leftover stock from the shop.',
      price: new Prisma.Decimal(1500),
      currency: 'EGP',
      location_label: 'Cairo',
      contact_phone: '+201000000001',
      status: 'pending_review',
    },
  });

  await prisma.siteListing.create({
    data: {
      category_id: cat.id,
      created_by_user_id: users.adminId,
      publisher_type: 'admin',
      title: 'Platform notice',
      body: 'Official demo listing published by admin.',
      status: 'published',
      reviewed_by_user_id: users.superAdminId,
      reviewed_at: new Date(),
      published_at: new Date(),
    },
  });

  await prisma.siteListing.create({
    data: {
      category_id: cat.id,
      merchant_id: merchants.merchantId,
      created_by_user_id: users.merchantUserId,
      publisher_type: 'merchant',
      title: 'Rejected sample',
      body: 'This listing violates demo policy.',
      status: 'rejected',
      reviewed_by_user_id: users.adminId,
      reviewed_at: new Date(),
      rejection_reason: 'Demo rejection path',
    },
  });
}
