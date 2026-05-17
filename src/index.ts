import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

import { buildApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';
import { disconnectRedis, initRedis } from './lib/redis.js';

const redisOk = await initRedis();
if (!redisOk) {
  console.warn(
    '[api] Redis is offline. Cart and checkout will fail until Redis is running (see startup message above).',
  );
}

const app = await buildApp();

const io = new Server(app.server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

io.use((socket, next) => {
  const fromAuth =
    typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null;
  const header = socket.handshake.headers.authorization;
  const fromHeader =
    typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const token = fromAuth ?? fromHeader;
  if (!token) {
    return next(new Error('Unauthorized'));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const payload = decoded as unknown as { sub?: number; role?: string };
    if (typeof payload.sub !== 'number' || typeof payload.role !== 'string') {
      return next(new Error('Unauthorized'));
    }
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  app.log.info({ socketId: socket.id, userId: socket.data.userId }, 'socket connected');

  socket.on('disconnect', () => {
    app.log.info({ socketId: socket.id }, 'socket disconnected');
  });
});

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`API running on http://localhost:${env.PORT}`);
  if (env.NODE_ENV !== 'production') {
    app.log.info(`Swagger docs on http://localhost:${env.PORT}/docs`);
  }
} catch (err) {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
  if (code === 'EADDRINUSE') {
    console.error(`[api] Port ${env.PORT} is already in use. Stop the other process or change PORT in .env`);
  } else {
    console.error('[api] Failed to start:', err);
  }
  process.exit(1);
}

const shutdown = async () => {
  await app.close();
  await io.close();
  await disconnectPrisma();
  await disconnectRedis();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
