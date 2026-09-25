import { describe, expect, it } from 'vitest';
import { isDatabaseDown } from './db-errors.js';

describe('isDatabaseDown', () => {
  it('таймаут пула pg, обёрнутый Prisma', () => {
    const cause = new Error('Connection terminated unexpectedly');
    expect(isDatabaseDown(new Error('Connection terminated due to connection timeout', { cause }))).toBe(true);
  });

  it('сетевой код в причине', () => {
    const cause = Object.assign(new Error('connect failed'), { code: 'ECONNREFUSED' });
    expect(isDatabaseDown(new Error('query failed', { cause }))).toBe(true);
  });

  it('обычные ошибки — не про базу', () => {
    expect(isDatabaseDown(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isDatabaseDown(Object.assign(new Error('unique'), { code: 'P2002' }))).toBe(false);
    expect(isDatabaseDown('string error')).toBe(false);
  });
});
