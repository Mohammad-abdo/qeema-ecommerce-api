import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import {
  getTranslationsBundle,
  listLocales,
  listTranslationKeysAdmin,
  upsertTranslationAdmin,
} from './i18n.service.js';
import {
  adminI18nKeysQuerySchema,
  adminUpsertTranslationBodySchema,
  translationsQuerySchema,
} from './i18n.validators.js';

export async function listLocalesController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listLocales());
}

export async function getTranslationsController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = translationsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await getTranslationsBundle(parsed.data));
}

export async function listAdminI18nKeysController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminI18nKeysQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listTranslationKeysAdmin(parsed.data));
}

export async function patchAdminI18nTranslationController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = adminUpsertTranslationBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await upsertTranslationAdmin(user.sub, parsed.data));
}
