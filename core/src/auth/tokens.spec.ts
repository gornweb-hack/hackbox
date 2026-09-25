import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { ACCESS_COOKIE, TokensService } from './tokens.js';

const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '15m' } });
const tokens = new TokensService(jwt);
const user = { id: '0190c0de-0000-7000-8000-000000000001', role: 'MANAGER' as const };

const request = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) =>
  ({ headers, cookies }) as unknown as Request;

describe('TokensService', () => {
  it('без токена — none', () => {
    expect(tokens.check(request())).toEqual({ status: 'none' });
  });

  it('токен из Bearer', () => {
    const token = tokens.signAccess(user);
    expect(tokens.check(request({ authorization: `Bearer ${token}` }))).toEqual({ status: 'valid', user });
  });

  it('токен из cookie', () => {
    const token = tokens.signAccess(user);
    expect(tokens.check(request({}, { [ACCESS_COOKIE]: token }))).toEqual({ status: 'valid', user });
  });

  it('Bearer важнее cookie', () => {
    const token = tokens.signAccess(user);
    const check = tokens.check(request({ authorization: 'Bearer garbage' }, { [ACCESS_COOKIE]: token }));
    expect(check).toEqual({ status: 'invalid' });
  });

  it('истёкший токен — expired, а не invalid', () => {
    const expired = new JwtService({ secret: 'test-secret' }).sign({
      sub: user.id,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    expect(tokens.check(request({ authorization: `Bearer ${expired}` }))).toEqual({ status: 'expired' });
  });

  it('чужая подпись и мусор — invalid', () => {
    const foreign = new JwtService({ secret: 'other' }).sign({ sub: user.id, role: user.role });
    expect(tokens.check(request({ authorization: `Bearer ${foreign}` }))).toEqual({ status: 'invalid' });
    expect(tokens.check(request({}, { [ACCESS_COOKIE]: 'not-a-jwt' }))).toEqual({ status: 'invalid' });
  });
});
