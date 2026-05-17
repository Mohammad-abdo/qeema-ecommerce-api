import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

import type { CreateAddressBody } from './addresses.validators.js';

export async function listAddressesForUser(userId: number) {
  return prisma.address.findMany({
    where: { user_id: userId },
    orderBy: [{ is_default: 'desc' }, { id: 'desc' }],
  });
}

export async function createAddressForUser(userId: number, body: CreateAddressBody) {
  if (body.is_default) {
    await prisma.address.updateMany({
      where: { user_id: userId },
      data: { is_default: false },
    });
  }
  return prisma.address.create({
    data: {
      user_id: userId,
      label: body.label,
      full_name: body.full_name,
      phone: body.phone,
      country: body.country,
      city: body.city,
      district: body.district,
      street: body.street,
      building: body.building,
      floor: body.floor,
      apartment: body.apartment,
      postal_code: body.postal_code,
      is_default: body.is_default ?? false,
    },
  });
}

export async function getAddressForUser(userId: number, addressId: number) {
  const row = await prisma.address.findFirst({
    where: { id: addressId, user_id: userId },
  });
  if (!row) throw new AppError(404, 'Address not found', 'NOT_FOUND');
  return row;
}
