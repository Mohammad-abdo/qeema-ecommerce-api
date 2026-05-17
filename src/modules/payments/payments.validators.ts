import { TxStatus } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const paymentLogListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    orderId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(TxStatus).optional(),
    gateway: z.string().max(64).optional(),
  });

export type PaymentLogListQuery = z.infer<typeof paymentLogListQuerySchema>;
