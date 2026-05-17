import type { UserRole } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { queueEmail } from '../../lib/email.js';
import { env } from '../../config/env.js';

import type { OAuthBody } from './auth.validators.js';
import {
  verifyAppleIdToken,
  verifyFacebookAccessToken,
  verifyGoogleIdToken,
  type OAuthProfile,
} from './oauth.providers.js';

async function verifyOAuthToken(body: OAuthBody): Promise<OAuthProfile> {
  if (body.provider === 'google') return verifyGoogleIdToken(body.token);
  if (body.provider === 'facebook') return verifyFacebookAccessToken(body.token);
  return verifyAppleIdToken(body.token, body.name);
}

async function issueSession(app: FastifyInstance, userId: number, role: UserRole) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.session.create({
    data: {
      user_id: userId,
      token,
      device_info: 'oauth',
      expires_at: expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { last_login_at: new Date() },
  });

  const jwtToken = app.jwt.sign({ sub: userId, role }, { expiresIn: env.JWT_EXPIRES_IN });

  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return {
    accessToken: jwtToken,
    sessionToken: token,
    user,
  };
}

async function queueWelcomeEmail(email: string, name: string) {
  const subject = 'Welcome to Esyasatgo';
  const text = `Hi ${name},\n\nYour account is ready. You can browse products, place orders, and manage your profile anytime.\n\nThank you for joining us!`;
  await queueEmail('auth.welcome', { to: email, subject, text });
}

export async function oauthLogin(app: FastifyInstance, body: OAuthBody) {
  const profile = await verifyOAuthToken(body);

  const existingLink = await prisma.userOAuthAccount.findUnique({
    where: {
      provider_provider_id: {
        provider: profile.provider,
        provider_id: profile.providerId,
      },
    },
    include: { user: true },
  });

  if (existingLink?.user) {
    const user = existingLink.user;
    if (user.deleted_at) throw new AppError(403, 'Account not found', 'ACCOUNT_BLOCKED');
    if (user.suspended_at || user.banned_at) {
      throw new AppError(403, 'Account suspended or banned', 'ACCOUNT_BLOCKED');
    }
    return issueSession(app, user.id, user.role);
  }

  let user = await prisma.user.findUnique({ where: { email: profile.email } });

  if (user && !user.deleted_at) {
    if (user.suspended_at || user.banned_at) {
      throw new AppError(403, 'Account suspended or banned', 'ACCOUNT_BLOCKED');
    }
    await prisma.userOAuthAccount.create({
      data: {
        user_id: user.id,
        provider: profile.provider,
        provider_id: profile.providerId,
        email: profile.email,
      },
    });
    if (profile.avatar && !user.avatar) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: profile.avatar },
      });
    }
    return issueSession(app, user.id, user.role);
  }

  const created = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: 'customer',
        email_verified_at: profile.emailVerified ? new Date() : null,
      },
    });
    await tx.userOAuthAccount.create({
      data: {
        user_id: newUser.id,
        provider: profile.provider,
        provider_id: profile.providerId,
        email: profile.email,
      },
    });
    return newUser;
  });

  await queueWelcomeEmail(created.email, created.name);
  return issueSession(app, created.id, created.role);
}
