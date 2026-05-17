import { randomBytes } from 'node:crypto';

import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { AppError } from '../../lib/errors.js';
import { queueEmail } from '../../lib/email.js';

import type { LoginBody, RegisterBody } from './auth.validators.js';

export async function login(app: FastifyInstance, body: LoginBody) {
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || user.deleted_at) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }
  if (user.suspended_at || user.banned_at) {
    throw new AppError(403, 'Account suspended or banned', 'ACCOUNT_BLOCKED');
  }
  if (!user.password_hash) {
    throw new AppError(
      401,
      'This account uses Google, Facebook, or Apple sign-in. Use those buttons below.',
      'OAUTH_ONLY',
    );
  }
  const ok = await verifyPassword(body.password, user.password_hash);
  if (!ok) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.session.create({
    data: {
      user_id: user.id,
      token,
      device_info: 'api',
      expires_at: expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  const jwtToken = app.jwt.sign(
    { sub: user.id, role: user.role },
    { expiresIn: env.JWT_EXPIRES_IN },
  );

  return {
    accessToken: jwtToken,
    sessionToken: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function logoutUser(userId: number) {
  await prisma.session.deleteMany({ where: { user_id: userId } });
}

export async function register(app: FastifyInstance, body: RegisterBody) {
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing && !existing.deleted_at) {
    throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const password_hash = await hashPassword(body.password);
  const role = body.accountType === 'merchant' ? 'merchant' : 'customer';

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          name: body.name,
          password_hash,
          role,
        },
      });
      if (body.accountType === 'merchant') {
        await tx.merchant.create({
          data: {
            user_id: user.id,
            store_name: body.store_name!,
            store_slug: body.store_slug!,
            business_type: body.business_type ?? 'individual',
            status: 'pending',
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Email or store slug already in use', 'CONFLICT');
    }
    throw e;
  }

  const result = await login(app, { email: body.email, password: body.password });
  const subject = 'Welcome to Esyasatgo';
  const text = `Hi ${body.name},\n\nYour account is ready. You can browse products and place orders anytime.\n\nThank you for joining us!`;
  await queueEmail('auth.welcome', { to: body.email, subject, text });
  return result;
}
