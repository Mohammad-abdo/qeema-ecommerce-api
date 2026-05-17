/**
 * BullMQ background workers: notifications, emails, commission clearing.
 * Run: npm run worker
 */
import 'dotenv/config';

import { Worker } from 'bullmq';

import { sendEmail } from '../lib/email.js';
import { processCommissionClear } from '../modules/orders/commission.service.js';
import { disconnectRedis, initRedis, redis, redisEnabled } from '../lib/redis.js';

if (!redisEnabled) {
  console.error('[worker] Redis is disabled (REDIS_ENABLED=false). Workers require Redis.');
  process.exit(1);
}

const redisOk = await initRedis();
if (!redisOk || !redis) {
  console.error('[worker] Redis is required. Start Redis (docker compose up -d redis) and run again.');
  process.exit(1);
}

const connection = redis.duplicate({
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    if (times > 12) return null;
    return Math.min(times * 500, 8_000);
  },
});

const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    console.log('[worker:notifications]', job.id, job.name, JSON.stringify(job.data));
  },
  { connection },
);

const emailsWorker = new Worker(
  'emails',
  async (job) => {
    const data = job.data as { to: string; subject: string; text: string; html?: string };
    if (!data.to || !data.subject) {
      throw new Error('Invalid email job payload');
    }
    const sent = await sendEmail({
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    });
    console.log('[worker:emails]', job.name, data.to, sent ? 'sent' : 'logged-only');
  },
  { connection },
);

const commissionWorker = new Worker(
  'commission',
  async (job) => {
    if (job.name === 'clear') {
      const { subOrderId } = job.data as { subOrderId: number };
      const result = await processCommissionClear(subOrderId);
      console.log('[worker:commission] cleared sub-order', subOrderId, result?.status);
      return;
    }
    console.log('[worker:commission] unknown job', job.name);
  },
  { connection },
);

for (const w of [notificationsWorker, emailsWorker, commissionWorker]) {
  w.on('failed', (job, err) => {
    console.error(`[worker:${w.name}] failed`, job?.id, err);
  });
}

const shutdown = async () => {
  await notificationsWorker.close();
  await emailsWorker.close();
  await commissionWorker.close();
  await connection.quit();
  await disconnectRedis();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

console.log('Workers listening: notifications, emails, commission. Press Ctrl+C to stop.');
