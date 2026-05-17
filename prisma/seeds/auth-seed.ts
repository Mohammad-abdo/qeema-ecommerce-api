import { randomBytes } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import type { SeedUsers } from './types.ts';

export async function seedAuthExtras(prisma: PrismaClient, users: SeedUsers) {
  const token = `seed-${randomBytes(24).toString('hex')}`;
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.session.create({
    data: {
      user_id: users.customerId,
      token,
      device_info: 'seed',
      ip_address: '127.0.0.1',
      expires_at: expires,
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: users.adminId,
      action: 'seed',
      module: 'system',
      entity_type: 'seed',
      entity_id: '1',
      new_values: { note: 'initial demo data' },
    },
  });
}
