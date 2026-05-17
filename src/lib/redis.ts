import { Redis, type RedisOptions } from 'ioredis';

import { env } from '../config/env.js';

/** When false, no Redis connection is opened (cart still works in-memory). */
export const redisEnabled = env.REDIS_ENABLED;

/** Set after successful `initRedis()` ping. */
export let redisAvailable = false;

/** Live client when `redisEnabled`; otherwise null. */
export let redis: Redis | null = null;

let helpLogged = false;
let lastErrorLog = 0;

function logRedisHelp(): void {
  if (helpLogged) return;
  helpLogged = true;
  console.warn(
    '[redis] Cannot connect. Cart still works in-memory; background jobs need Redis.\n' +
      '  Or set REDIS_ENABLED=false in .env to silence Redis.\n' +
      '  Start Redis: docker compose up -d redis\n' +
      `  URL in .env: ${env.REDIS_URL}`,
  );
}

function logRedisErrorThrottled(message: string): void {
  const now = Date.now();
  if (now - lastErrorLog < 30_000) return;
  lastErrorLog = now;
  console.warn('[redis]', message);
}

function connectionOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 5_000,
    retryStrategy(times) {
      if (times === 1) logRedisHelp();
      if (times > 12) return null;
      return Math.min(times * 500, 8_000);
    },
  };
}

function attachRedisListeners(client: Redis): void {
  client.on('error', (err) => {
    logRedisErrorThrottled(err.message);
  });
  client.on('connect', () => {
    redisAvailable = true;
  });
  client.on('close', () => {
    redisAvailable = false;
  });
}

function ensureRedisClient(): Redis {
  if (!redisEnabled) {
    throw new Error('Redis is disabled (REDIS_ENABLED=false)');
  }
  if (!redis) {
    redis = new Redis(env.REDIS_URL, connectionOptions());
    attachRedisListeners(redis);
  }
  return redis;
}

/** Call once at process startup before handling traffic. */
export async function initRedis(): Promise<boolean> {
  if (!redisEnabled) {
    redisAvailable = false;
    console.info('[redis] Disabled (REDIS_ENABLED=false). Cart uses in-memory storage.');
    return false;
  }

  const client = ensureRedisClient();

  if (client.status === 'ready') {
    try {
      await client.ping();
      redisAvailable = true;
      return true;
    } catch {
      redisAvailable = false;
      return false;
    }
  }

  try {
    await Promise.race([
      (async () => {
        await client.connect();
        await client.ping();
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('connect_timeout')), 6_000);
      }),
    ]);
    redisAvailable = true;
    console.info('[redis] Connected');
    return true;
  } catch {
    redisAvailable = false;
    client.disconnect(false);
    logRedisHelp();
    return false;
  }
}

/** Reconnect after Redis was started later (optional). */
export async function reconnectRedis(): Promise<boolean> {
  if (!redisEnabled) return false;
  const client = ensureRedisClient();
  if (client.status === 'ready') return true;
  try {
    await client.connect();
    await client.ping();
    redisAvailable = true;
    console.info('[redis] Connected');
    return true;
  } catch {
    redisAvailable = false;
    client.disconnect(false);
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!redis) return;
  const { status } = redis;
  if (status === 'end' || status === 'close') {
    redis = null;
    return;
  }
  if (status === 'ready') {
    await redis.quit();
  } else {
    redis.disconnect(false);
  }
  redis = null;
  redisAvailable = false;
}
