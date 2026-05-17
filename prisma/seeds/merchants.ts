import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { MERCHANT_BANNERS, MERCHANT_LOGOS } from './seed-media.ts';
import type { SeedMerchants, SeedMerchantRow, SeedUsers } from './types.ts';

const MERCHANT_DEFS: Array<{
  store_name: string;
  store_slug: string;
  store_name_ar: string;
  categoryIndex: number;
  email?: string;
  is_featured?: boolean;
}> = [
  {
    store_name: 'Demo Electronics',
    store_slug: 'demo-electronics',
    store_name_ar: 'ديمو إلكترونيات',
    categoryIndex: 0,
    is_featured: true,
  },
  {
    store_name: 'Fashion Hub',
    store_slug: 'fashion-hub',
    store_name_ar: 'مركز الأزياء',
    categoryIndex: 1,
    email: 'merchant-fashion@erp.local',
    is_featured: true,
  },
  {
    store_name: 'Home Comfort',
    store_slug: 'home-comfort',
    store_name_ar: 'راحة المنزل',
    categoryIndex: 2,
    email: 'merchant-home@erp.local',
    is_featured: true,
  },
  {
    store_name: 'Beauty Luxe',
    store_slug: 'beauty-luxe',
    store_name_ar: 'بيوتي لوكس',
    categoryIndex: 3,
    email: 'merchant-beauty@erp.local',
    is_featured: true,
  },
  {
    store_name: 'Sports Arena',
    store_slug: 'sports-arena',
    store_name_ar: 'ساحة الرياضة',
    categoryIndex: 4,
    email: 'merchant-sports@erp.local',
  },
  {
    store_name: 'Book Corner',
    store_slug: 'book-corner',
    store_name_ar: 'ركن الكتب',
    categoryIndex: 5,
    email: 'merchant-books@erp.local',
  },
  {
    store_name: 'Toy World',
    store_slug: 'toy-world',
    store_name_ar: 'عالم الألعاب',
    categoryIndex: 6,
    email: 'merchant-toys@erp.local',
  },
  {
    store_name: 'Fresh Market',
    store_slug: 'fresh-market',
    store_name_ar: 'السوق الطازج',
    categoryIndex: 7,
    email: 'merchant-grocery@erp.local',
  },
  {
    store_name: 'Mobile Plus',
    store_slug: 'mobile-plus',
    store_name_ar: 'موبايل بلس',
    categoryIndex: 0,
    email: 'merchant-mobile@erp.local',
  },
  {
    store_name: 'Style Street',
    store_slug: 'style-street',
    store_name_ar: 'شارع الموضة',
    categoryIndex: 1,
    email: 'merchant-style@erp.local',
  },
  {
    store_name: 'Kitchen Pro',
    store_slug: 'kitchen-pro',
    store_name_ar: 'كيتشن برو',
    categoryIndex: 2,
    email: 'merchant-kitchen@erp.local',
  },
  {
    store_name: 'Glow Beauty',
    store_slug: 'glow-beauty',
    store_name_ar: 'جلو بيوتي',
    categoryIndex: 3,
    email: 'merchant-glow@erp.local',
  },
];

export async function seedMerchants(prisma: PrismaClient, users: SeedUsers): Promise<SeedMerchants> {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const rows: SeedMerchantRow[] = [];

  for (let i = 0; i < MERCHANT_DEFS.length; i++) {
    const def = MERCHANT_DEFS[i]!;
    const logo = MERCHANT_LOGOS[i % MERCHANT_LOGOS.length]!;
    const banner = MERCHANT_BANNERS[i % MERCHANT_BANNERS.length]!;

    let userId: number;
    if (i === 0) {
      userId = users.merchantUserId;
    } else {
      const user = await prisma.user.create({
        data: {
          email: def.email!,
          name: `${def.store_name} Owner`,
          password_hash: passwordHash,
          role: 'merchant',
          email_verified_at: new Date(),
        },
      });
      await prisma.notificationPreference.create({
        data: { user_id: user.id, order_updates: true, promotions: true, support: true },
      });
      userId = user.id;
    }

    const merchant = await prisma.merchant.create({
      data: {
        user_id: userId,
        store_name: def.store_name,
        store_slug: def.store_slug,
        store_logo: logo,
        store_banner: banner,
        store_description: `Welcome to ${def.store_name} — curated products with fast delivery.`,
        business_type: 'company',
        tax_number: `SEED${String(100000 + i)}`,
        status: 'approved',
        approved_at: new Date(),
        approved_by: users.adminId,
        commission_rate: new Prisma.Decimal(10),
        balance: new Prisma.Decimal(2500 + i * 500),
        pending_balance: new Prisma.Decimal(0),
        is_featured: def.is_featured ?? false,
        rating: new Prisma.Decimal((4.2 + (i % 8) * 0.1).toFixed(1)),
        rating_count: 12 + i * 3,
        total_orders: 20 + i * 5,
      },
    });

    await prisma.merchantSettings.create({
      data: {
        merchant_id: merchant.id,
        min_order_amount: new Prisma.Decimal(0),
        auto_confirm_orders: i % 3 === 0,
        processing_time_days: 2,
      },
    });

    if (i < 4) {
      await prisma.merchantDocument.create({
        data: {
          merchant_id: merchant.id,
          doc_type: 'commercial_register',
          file_path: `/uploads/seed/${def.store_slug}-cr.pdf`,
          status: 'verified',
          reviewed_by: users.adminId,
          reviewed_at: new Date(),
        },
      });
    }

    rows.push({
      id: merchant.id,
      store_name: def.store_name,
      store_slug: def.store_slug,
      store_name_ar: def.store_name_ar,
      categoryIndex: def.categoryIndex,
    });
  }

  return {
    merchantId: rows[0]!.id,
    merchants: rows,
  };
}
