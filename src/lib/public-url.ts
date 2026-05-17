import type { FastifyRequest } from 'fastify';

import { env } from '../config/env.js';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Public base URL for uploaded files and absolute API links (no trailing slash). */
export function getPublicApiBaseUrl(request?: FastifyRequest): string {
  if (env.API_PUBLIC_URL) {
    return stripTrailingSlash(env.API_PUBLIC_URL);
  }

  if (request) {
    const forwardedProto = request.headers['x-forwarded-proto'];
    const proto =
      (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0]?.trim() : null) ||
      (request.protocol === 'https' ? 'https' : 'http');
    const forwardedHost = request.headers['x-forwarded-host'];
    const host =
      (typeof forwardedHost === 'string' ? forwardedHost.split(',')[0]?.trim() : null) ||
      request.headers.host;
    if (host) {
      return stripTrailingSlash(`${proto}://${host}`);
    }
  }

  return `http://localhost:${env.PORT}`;
}

export function publicUploadUrl(filename: string, request?: FastifyRequest): string {
  return `${getPublicApiBaseUrl(request)}/uploads/${filename}`;
}
