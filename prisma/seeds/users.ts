import type { PrismaClient } from '@prisma/client';

import type { SeedUsers } from './types.ts';

export async function seedUsers(prisma: PrismaClient, passwordHash: string): Promise<SeedUsers> {
  const superAdmin = await prisma.user.create({
    data: {
      email: 'super@erp.local',
      name: 'Super Admin',
      password_hash: passwordHash,
      role: 'super_admin',
      email_verified_at: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@erp.local',
      name: 'Platform Admin',
      password_hash: passwordHash,
      role: 'admin',
      email_verified_at: new Date(),
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@erp.local',
      name: 'Ops Employee',
      password_hash: passwordHash,
      role: 'employee',
      email_verified_at: new Date(),
    },
  });

  const merchantUser = await prisma.user.create({
    data: {
      email: 'merchant@erp.local',
      name: 'Demo Merchant Owner',
      password_hash: passwordHash,
      role: 'merchant',
      email_verified_at: new Date(),
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@erp.local',
      name: 'Demo Customer',
      password_hash: passwordHash,
      role: 'customer',
      email_verified_at: new Date(),
    },
  });

  const userIds = [superAdmin.id, admin.id, employeeUser.id, merchantUser.id, customer.id];
  await prisma.notificationPreference.createMany({
    data: userIds.map((user_id) => ({
      user_id,
      order_updates: true,
      promotions: true,
      support: true,
    })),
  });

  return {
    superAdminId: superAdmin.id,
    adminId: admin.id,
    employeeUserId: employeeUser.id,
    merchantUserId: merchantUser.id,
    customerId: customer.id,
  };
}
