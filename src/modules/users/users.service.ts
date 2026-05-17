import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { canManageUsers, isStaffRole } from '../../lib/rbac.js';

import type { PatchMeBody, PatchUserAdminBody, UserListQuery } from './users.validators.js';

export async function getMe(userId: number) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatar: true,
      created_at: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
  return user;
}

export async function listUsers(q: UserListQuery) {
  const { page, limit } = q;
  const skip = (page - 1) * limit;
  const where: Prisma.UserWhereInput = { deleted_at: null };
  if (q.role) where.role = q.role;
  if (q.isActive !== undefined) where.is_active = q.isActive;
  if (q.search) {
    where.OR = [
      { email: { contains: q.search } },
      { name: { contains: q.search } },
      { phone: { contains: q.search } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { id: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getUserById(requesterId: number, requesterRole: string, targetId: number) {
  if (targetId !== requesterId && !isStaffRole(requesterRole)) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  const user = await prisma.user.findFirst({
    where: { id: targetId, deleted_at: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatar: true,
      created_at: true,
      is_active: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
  return user;
}

export async function updateMe(userId: number, body: PatchMeBody) {
  const existing = await prisma.user.findFirst({ where: { id: userId, deleted_at: null } });
  if (!existing) throw new AppError(404, 'User not found', 'NOT_FOUND');
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatar: true,
      updated_at: true,
    },
  });
}

export async function updateUserByAdmin(actorRole: string, targetId: number, body: PatchUserAdminBody) {
  if (!canManageUsers(actorRole)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  const existing = await prisma.user.findFirst({ where: { id: targetId, deleted_at: null } });
  if (!existing) throw new AppError(404, 'User not found', 'NOT_FOUND');
  return prisma.user.update({
    where: { id: targetId },
    data: {
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.is_active != null ? { is_active: body.is_active } : {}),
      ...(body.role != null ? { role: body.role } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      is_active: true,
      updated_at: true,
    },
  });
}
