import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';

import { env } from '../config/env.js';
import { redis, redisAvailable, redisEnabled } from '../lib/redis.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: import('fastify').preHandlerHookHandler;
    optionalAuthenticate: import('fastify').preHandlerHookHandler;
  }
}

export const registerPlugins = fp(async (app) => {
  await app.register(cors, { origin: env.FRONTEND_URL, credentials: true });
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    ...(env.NODE_ENV === 'test' || !redisEnabled || !redisAvailable || !redis
      ? {}
      : {
          redis,
          nameSpace: 'api-rate',
        }),
  });
  await app.register(jwt, { secret: env.JWT_SECRET });

  async function verifyRequestUser(request: import('fastify').FastifyRequest) {
    const cookieHeader = request.headers.cookie;
    const match = cookieHeader?.match(/(?:^|;\s*)erp_access_token=([^;]+)/);
    const cookieToken = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (cookieToken) {
      const decoded = await request.server.jwt.verify(cookieToken);
      request.user = decoded as import('@fastify/jwt').FastifyJWT['user'];
    } else {
      await request.jwtVerify();
    }
  }

  app.decorate('authenticate', async (request, reply) => {
    try {
      await verifyRequestUser(request);
    } catch {
      reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  app.decorate('optionalAuthenticate', async (request) => {
    try {
      await verifyRequestUser(request);
    } catch {
      delete (request as { user?: import('@fastify/jwt').FastifyJWT['user'] }).user;
    }
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'ERP Backend API', version: '0.1.0' },
    },
  });

  if (env.NODE_ENV !== 'production') {
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }
});