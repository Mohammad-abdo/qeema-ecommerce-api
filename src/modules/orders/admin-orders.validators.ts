import { OrderStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const adminOrderListQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  search: z.string().max(120).optional(),
});

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
