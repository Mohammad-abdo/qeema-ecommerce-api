import { Redis, type RedisOptions } from 'ioredis';

import { env } from '../config/env.js';

/** Set after successful `initRedis()` ping. */
export let redisAvailable = false;

let helpLogged = false;
let lastErrorLog = 0;

function logRedisHelp(): void {
  if (helpLogged) return;
  helpLogged = true;
  console.warn(
    '[redis] Cannot connect. Cart and background jobs need Redis.\n' +
      '  Start Redis: docker run -d --name erp-redis -p 6379:6379 redis:7-alpine\n' +
      '  Or from repo root: docker compose up -d redis\n' +
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

export const redis = new Redis(env.REDIS_URL, connectionOptions());

redis.on('error', (err) => {
  logRedisErrorThrottled(err.message);
});

redis.on('connect', () => {
  redisAvailable = true;
});

redis.on('close', () => {
  redisAvailable = false;
});

/** Call once at process startup before handling traffic. */
export async function initRedis(): Promise<boolean> {
  if (redis.status === 'ready') {
    try {
      await redis.ping();
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
        await redis.connect();
        await redis.ping();
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
    redis.disconnect(false);
    logRedisHelp();
    return false;
  }
}

/** Reconnect after Redis was started later (optional). */
export async function reconnectRedis(): Promise<boolean> {
  if (redis.status === 'ready') return true;
  try {
    await redis.connect();
    await redis.ping();
    redisAvailable = true;
    console.info('[redis] Connected');
    return true;
  } catch {
    redisAvailable = false;
    redis.disconnect(false);
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  const { status } = redis;
  if (status === 'end' || status === 'close') return;
  if (status === 'ready') {
    await redis.quit();
    return;
  }
  redis.disconnect(false);
}
