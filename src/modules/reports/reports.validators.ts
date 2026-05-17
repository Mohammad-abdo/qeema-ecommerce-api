import { ReportRunStatus } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const createReportRunBodySchema = z.object({
  reportDefinitionId: z.number().int().positive().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export type CreateReportRunBody = z.infer<typeof createReportRunBodySchema>;

export const reportRunListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    status: z.nativeEnum(ReportRunStatus).optional(),
    merchantId: z.coerce.number().int().positive().optional(),
  });

export type ReportRunListQuery = z.infer<typeof reportRunListQuerySchema>;
