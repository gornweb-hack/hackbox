import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('верный пароль проходит, неверный — нет', async () => {
    const stored = await hashPassword('secret123');
    expect(await verifyPassword('secret123', stored)).toBe(true);
    expect(await verifyPassword('secret124', stored)).toBe(false);
  });

  it('одинаковые пароли дают разные хэши (соль)', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('испорченный хэш не проходит и не бросает исключение', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$a$b')).toBe(false);
  });
});
