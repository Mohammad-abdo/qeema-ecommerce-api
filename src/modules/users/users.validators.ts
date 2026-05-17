import { UserRole } from '@prisma/client';
import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

export const userListQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(200).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const patchUserAdminBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    is_active: z.boolean().optional(),
    role: z.nativeEnum(UserRole).optional(),
  })
  .refine((b) => b.name != null || b.is_active != null || b.role != null, {
    message: 'At least one field is required',
  });

export type PatchUserAdminBody = z.infer<typeof patchUserAdminBodySchema>;

export const patchMeBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    phone: z.string().max(32).nullable().optional(),
    avatar: z.string().max(1024).nullable().optional(),
  })
  .refine((b) => b.name != null || b.phone !== undefined || b.avatar !== undefined, {
    message: 'At least one field is required',
  });

export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
