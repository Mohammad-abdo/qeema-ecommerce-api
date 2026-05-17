/** Mutate process.env before importing any module that loads `src/config/env.ts`. */
export function ensureTestEnv(): void {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = '01234567890123456789012345678901';
  }
  process.env.JWT_EXPIRES_IN ??= '1h';
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL ??= 'http://localhost:3000';
  process.env.DATABASE_URL ??= 'mysql://root:@127.0.0.1:3306/erp';
  process.env.REDIS_URL ??= 'redis://127.0.0.1:6379';
}
