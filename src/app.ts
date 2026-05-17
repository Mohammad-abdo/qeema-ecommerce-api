import Fastify from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { registerPlugins } from './plugins/index.js';
import { registerModules } from './modules/index.js';
import { AppError } from './lib/errors.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  await app.register(registerPlugins);
  await app.register(registerModules);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: 'Validation failed',
        errors: error.flatten(),
      });
    }
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ message: 'Not found' });
      }
      if (error.code === 'P2002') {
        return reply.code(409).send({ message: 'Conflict', code: 'UNIQUE_VIOLATION' });
      }
    }
    request.log.error(error);
    return reply.code(500).send({ message: 'Internal server error' });
  });

  return app;
}
