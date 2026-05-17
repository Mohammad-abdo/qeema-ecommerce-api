import { Queue } from 'bullmq';

import { redis, redisAvailable } from './redis.js';

export type AppQueues = {
  notifications: Queue;
  emails: Queue;
  inventory: Queue;
  commission: Queue;
};

let cache: AppQueues | null = null;

function queueConnectionOptions() {
  return {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    retryStrategy(times: number) {
      if (times > 12) return null;
      return Math.min(times * 500, 8_000);
    },
  };
}

/** BullMQ queues — only created when Redis is available. */
export function getQueues(): AppQueues | null {
  if (!redisAvailable) return null;
  if (cache) return cache;

  const connection = redis.duplicate(queueConnectionOptions());
  cache = {
    notifications: new Queue('notifications', { connection }),
    emails: new Queue('emails', { connection: redis.duplicate(queueConnectionOptions()) }),
    inventory: new Queue('inventory', { connection: redis.duplicate(queueConnectionOptions()) }),
    commission: new Queue('commission', { connection: redis.duplicate(queueConnectionOptions()) }),
  };
  return cache;
}

export function resetQueuesForTests(): void {
  cache = null;
}
