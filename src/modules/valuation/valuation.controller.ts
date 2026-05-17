import type { FastifyReply, FastifyRequest } from 'fastify';

import { saveUpload } from '../uploads/uploads.service.js';

import { runValuation } from './valuation.service.js';
import { valuationBodySchema } from './valuation.validators.js';

export async function createValuationController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = valuationBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }

  const body = parsed.data;
  if (body.mode === 'quick' && !body.imageHint?.trim() && !buildHasText(body)) {
    return reply.code(400).send({ message: 'Product image or search hint is required for quick scan' });
  }
  if (body.mode === 'detailed' && !body.title?.trim()) {
    return reply.code(400).send({ message: 'Product title is required for detailed analysis' });
  }

  const data = await runValuation(body);
  return reply.send({ success: true, data });
}

function buildHasText(body: { title?: string; brand?: string; description?: string }) {
  return Boolean(body.title?.trim() || body.brand?.trim() || body.description?.trim());
}

export async function uploadValuationImageController(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file();
  if (!file) return reply.code(400).send({ message: 'No file uploaded' });
  const result = await saveUpload(file, request);
  const hint = result.filename;
  return reply.send({ success: true, data: { url: result.url, filename: result.filename, imageHint: hint } });
}
