import { z } from 'zod';

export const createAddressBodySchema = z.object({
  label: z.string().max(64).optional(),
  full_name: z.string().min(1).max(120),
  phone: z.string().max(32).optional(),
  country: z.string().min(2).max(2).default('EG'),
  city: z.string().min(1).max(120),
  district: z.string().max(120).optional(),
  street: z.string().min(1).max(255),
  building: z.string().max(64).optional(),
  floor: z.string().max(32).optional(),
  apartment: z.string().max(32).optional(),
  postal_code: z.string().max(20).optional(),
  is_default: z.boolean().optional(),
});

export type CreateAddressBody = z.infer<typeof createAddressBodySchema>;

export const addressIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
