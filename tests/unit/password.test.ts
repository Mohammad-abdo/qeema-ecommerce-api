import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../../src/lib/password.js';

describe('password', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('SecretPass123!');
    expect(hash).not.toContain('SecretPass');
    expect(await verifyPassword('SecretPass123!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
