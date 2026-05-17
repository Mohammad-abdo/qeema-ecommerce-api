import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

import type { MultipartFile } from '@fastify/multipart';

import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function saveUpload(file: MultipartFile) {
  if (!file.mimetype || !ALLOWED_MIME.has(file.mimetype)) {
    throw new AppError(400, 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF', 'BAD_REQUEST');
  }

  const ext = MIME_TO_EXT[file.mimetype] ?? '.jpg';
  const dir = path.join(process.cwd(), 'uploads');
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(dir, filename);
  let bytes = 0;
  const counter = file.file;
  counter.on('data', (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes > MAX_BYTES) counter.destroy(new AppError(400, 'File too large (max 5MB)', 'BAD_REQUEST'));
  });
  await pipeline(counter, createWriteStream(filepath));

  const base = env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}`;
  return { url: `${base}/uploads/${filename}`, filename };
}
