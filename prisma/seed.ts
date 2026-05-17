/// <reference types="node" />

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { seedAuthExtras } from './seeds/auth-seed.ts';
import { seedCatalog } from './seeds/catalog.ts';
import { seedEngagement } from './seeds/engagement.ts';
import { seedFoundations } from './seeds/foundations.ts';
import { seedHr } from './seeds/hr.ts';
import { seedI18nSample } from './seeds/i18n_sample.ts';
import { seedMarketing } from './seeds/marketing.ts';
import { seedMerchants } from './seeds/merchants.ts';
import { seedNotifications } from './seeds/notifications.ts';
import { seedOrdersCommerce } from './seeds/orders.ts';
import { seedPayments } from './seeds/payments.ts';
import { seedReports } from './seeds/reports.ts';
import { seedSearch } from './seeds/search.ts';
import { seedSiteListings } from './seeds/site_listings.ts';
import { seedSupport } from './seeds/support.ts';
import { seedUsers } from './seeds/users.ts';
import { seedWarehouse } from './seeds/warehouse.ts';
import { seedStorefront } from './seeds/storefront.ts';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('Seed skipped: users already exist. Run `npx prisma migrate reset` to wipe and re-seed.');
    return;
  }

  const demoPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  console.log('Seeding (demo password for all users):', demoPassword);

  const foundations = await seedFoundations(prisma);
  const users = await seedUsers(prisma, passwordHash);
  await seedAuthExtras(prisma, users);
  await seedHr(prisma, users);
  const merchants = await seedMerchants(prisma, users);
  const catalog = await seedCatalog(prisma, merchants, users);
  const warehouse = await seedWarehouse(prisma, merchants, catalog);
  const commerce = await seedOrdersCommerce(prisma, users, merchants, catalog, warehouse);
  await seedPayments(prisma, users, merchants, commerce);
  await seedMarketing(prisma, merchants, catalog, users);
  await seedStorefront(prisma, merchants, catalog);
  await seedEngagement(prisma, users, merchants, catalog, commerce);
  await seedNotifications(prisma, users);
  await seedSupport(prisma, users, merchants, catalog, warehouse);
  await seedSiteListings(prisma, users, merchants);
  await seedReports(prisma, users, merchants);
  await seedI18nSample(prisma, users, foundations, merchants, catalog);
  await seedSearch(prisma, merchants, catalog);

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
