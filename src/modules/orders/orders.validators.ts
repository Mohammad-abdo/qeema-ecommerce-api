import { OrderStatus, PaymentStatus, SubOrderStatus } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const subOrderParamsSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  subOrderId: z.coerce.number().int().positive(),
});

export const orderListUserQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    status: z.nativeEnum(OrderStatus).optional(),
    merchantId: z.coerce.number().int().positive().optional(),
  });

export type OrderListUserQuery = z.infer<typeof orderListUserQuerySchema>;

export const patchOrderBodySchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  })
  .refine((b) => b.status != null || b.paymentStatus != null, {
    message: 'At least one of status, paymentStatus is required',
  });

export type PatchOrderBody = z.infer<typeof patchOrderBodySchema>;

export const patchSubOrderBodySchema = z.object({
  status: z.nativeEnum(SubOrderStatus),
});

export type PatchSubOrderBody = z.infer<typeof patchSubOrderBodySchema>;

export const createTrackingEventBodySchema = z.object({
  eventCode: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  subOrderId: z.number().int().positive().optional(),
  visibleToCustomer: z.boolean().default(true),
});

export type CreateTrackingEventBody = z.infer<typeof createTrackingEventBodySchema>;
