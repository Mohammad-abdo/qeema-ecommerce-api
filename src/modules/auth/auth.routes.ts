import type { FastifyInstance } from 'fastify';

import { loginController, logoutController, oauthController, registerController } from './auth.controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/v1/auth/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
      },
    },
    schema: {
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (request, reply) => loginController(app, request, reply));

  app.post('/api/v1/auth/register', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
      },
    },
    schema: { tags: ['Auth'] },
  }, async (request, reply) => registerController(app, request, reply));

  app.post('/api/v1/auth/oauth', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '15 minutes',
      },
    },
    schema: { tags: ['Auth'] },
  }, async (request, reply) => oauthController(app, request, reply));

  app.post('/api/v1/auth/logout', {
    preHandler: [app.authenticate],
    schema: { tags: ['Auth'] },
  }, logoutController);
}
