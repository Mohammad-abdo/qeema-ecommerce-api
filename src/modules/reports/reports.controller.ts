import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { createReportRun, listReportDefinitions, listReportRuns } from './reports.service.js';
import { createReportRunBodySchema, reportRunListQuerySchema } from './reports.validators.js';

export async function listReportDefinitionsController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  return reply.send(await listReportDefinitions(user.sub, user.role));
}

export async function createReportRunController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = createReportRunBodySchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const run = await createReportRun(user.sub, user.role, parsed.data);
  return reply.code(201).send(run);
}

export async function listReportRunsController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = reportRunListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listReportRuns(user.sub, user.role, parsed.data));
}
