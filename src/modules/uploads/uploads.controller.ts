import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import { saveUpload } from './uploads.service.js';

export async function uploadFileController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const file = await request.file();
  if (!file) return reply.code(400).send({ message: 'No file uploaded' });
  const result = await saveUpload(file, request);
  return reply.send({ success: true, ...result });
}
