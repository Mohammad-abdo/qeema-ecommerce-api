import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  /** Set to false to skip Redis (cart uses in-memory storage; background workers need Redis). */
  REDIS_ENABLED: z
    .enum(['true', 'false', '1', '0'])
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  JWT_SECRET: z.string().min(32),
  /** Access token TTL (e.g. 15m, 24h, 7d). Shorter is safer for production. */
  JWT_EXPIRES_IN: z.string().min(2).default('24h'),
  API_PUBLIC_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  /** Delay before merchant commission is cleared to wallet (default 3 days). Use 60000 for dev. */
  COMMISSION_CLEAR_DELAY_MS: z.coerce.number().int().nonnegative().default(3 * 24 * 60 * 60 * 1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;