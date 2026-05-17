import { InvoiceStatus } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const invoiceListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    orderId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
    search: z.string().max(200).optional(),
  });

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

export const invoiceIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const archiveInvoiceBodySchema = z.object({
  archiveUri: z.string().min(1).max(2048),
  archiveTier: z.enum(['hot', 'warm', 'cold']),
  archiveFingerprint: z.string().max(128).optional(),
});

export type ArchiveInvoiceBody = z.infer<typeof archiveInvoiceBodySchema>;
