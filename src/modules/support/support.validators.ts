import { TicketPriority, TicketStatus } from '@prisma/client';
import { z } from 'zod';

import { listDateRangeSchema, paginationQuerySchema } from '../../lib/pagination.js';

export const createTicketBodySchema = z.object({
  subject: z.string().min(3).max(255),
  description: z.string().min(5),
  category: z.enum(['order', 'payment', 'product', 'shipping', 'account', 'other']),
  merchantId: z.number().int().positive().optional(),
});

export type CreateTicketBody = z.infer<typeof createTicketBodySchema>;

export const ticketMessageBodySchema = z.object({
  message: z.string().min(1),
});

export const ticketIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ticketListQuerySchema = paginationQuerySchema
  .merge(listDateRangeSchema)
  .extend({
    status: z.nativeEnum(TicketStatus).optional(),
    merchantId: z.coerce.number().int().positive().optional(),
    search: z.string().max(200).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
  });

export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;

export const patchTicketBodySchema = z
  .object({
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    assigned_to: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine((b) => b.status != null || b.priority != null || b.assigned_to !== undefined, {
    message: 'At least one field is required',
  });

export type PatchTicketBody = z.infer<typeof patchTicketBodySchema>;
