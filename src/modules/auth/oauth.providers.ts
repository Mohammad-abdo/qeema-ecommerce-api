import { OAuth2Client } from 'google-auth-library';
import * as jose from 'jose';

import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';

export type OAuthProfile = {
  provider: 'google' | 'facebook' | 'apple';
  providerId: string;
  email: string;
  name: string;
  avatar: string | null;
  emailVerified: boolean;
};

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

export async function verifyGoogleIdToken(idToken: string): Promise<OAuthProfile> {
  if (!googleClient || !env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, 'Google sign-in is not configured', 'OAUTH_NOT_CONFIGURED');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AppError(401, 'Invalid Google token', 'INVALID_OAUTH_TOKEN');
  }
  return {
    provider: 'google',
    providerId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email.split('@')[0] ?? 'User',
    avatar: payload.picture ?? null,
    emailVerified: payload.email_verified === true,
  };
}

export async function verifyFacebookAccessToken(accessToken: string): Promise<OAuthProfile> {
  if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
    throw new AppError(503, 'Facebook sign-in is not configured', 'OAUTH_NOT_CONFIGURED');
  }
  const appToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;
  const debugUrl = new URL('https://graph.facebook.com/debug_token');
  debugUrl.searchParams.set('input_token', accessToken);
  debugUrl.searchParams.set('access_token', appToken);
  const debugRes = await fetch(debugUrl);
  const debugJson = (await debugRes.json()) as {
    data?: { is_valid?: boolean; user_id?: string };
    error?: { message: string };
  };
  if (!debugRes.ok || !debugJson.data?.is_valid || !debugJson.data.user_id) {
    throw new AppError(401, 'Invalid Facebook token', 'INVALID_OAUTH_TOKEN');
  }

  const meUrl = new URL('https://graph.facebook.com/me');
  meUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
  meUrl.searchParams.set('access_token', accessToken);
  const meRes = await fetch(meUrl);
  const me = (await meRes.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
    error?: { message: string };
  };
  if (!meRes.ok || !me.id) {
    throw new AppError(401, me.error?.message ?? 'Facebook profile unavailable', 'INVALID_OAUTH_TOKEN');
  }
  if (!me.email) {
    throw new AppError(
      400,
      'Facebook did not share your email. Allow email permission or use another sign-in method.',
      'OAUTH_EMAIL_REQUIRED',
    );
  }

  return {
    provider: 'facebook',
    providerId: me.id,
    email: me.email.toLowerCase(),
    name: me.name ?? me.email.split('@')[0] ?? 'User',
    avatar: me.picture?.data?.url ?? null,
    emailVerified: true,
  };
}

export async function verifyAppleIdToken(idToken: string, nameHint?: string): Promise<OAuthProfile> {
  if (!env.APPLE_CLIENT_ID) {
    throw new AppError(503, 'Apple sign-in is not configured', 'OAUTH_NOT_CONFIGURED');
  }
  const JWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
  const { payload } = await jose.jwtVerify(idToken, JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: env.APPLE_CLIENT_ID,
  });
  const sub = payload.sub;
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  if (!sub) {
    throw new AppError(401, 'Invalid Apple token', 'INVALID_OAUTH_TOKEN');
  }
  if (!email) {
    throw new AppError(
      400,
      'Apple did not provide an email. Use email sharing on first sign-in or link an existing account.',
      'OAUTH_EMAIL_REQUIRED',
    );
  }
  const verified = payload.email_verified === true || payload.email_verified === 'true';
  return {
    provider: 'apple',
    providerId: sub,
    email,
    name: nameHint?.trim() || email.split('@')[0] || 'User',
    avatar: null,
    emailVerified: verified,
  };
}
