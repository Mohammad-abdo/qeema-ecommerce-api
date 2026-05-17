import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import { uploadFileController } from './uploads.controller.js';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function uploadsRoutes(app: FastifyInstance) {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  app.get('/uploads/:filename', async (request, reply) => {
    const filename = String((request.params as { filename: string }).filename ?? '');
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return reply.code(400).send({ message: 'Invalid filename' });
    }
    const filepath = path.join(uploadsDir, filename);
    try {
      await access(filepath);
    } catch {
      return reply.code(404).send({ message: 'Not found' });
    }
    const ext = path.extname(filename).toLowerCase();
    return reply.type(MIME[ext] ?? 'application/octet-stream').send(createReadStream(filepath));
  });

  app.post('/api/v1/uploads', {
    preHandler: [app.authenticate, requireRoles('merchant', 'admin', 'super_admin', 'employee')],
    schema: { tags: ['Uploads'] },
  }, uploadFileController);
}
