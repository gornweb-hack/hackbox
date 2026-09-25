import { Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Role } from '../generated/prisma/client.js';

export const ACCESS_COOKIE = 'hb_access';
export const REFRESH_COOKIE = 'hb_refresh';

// Кто сделал запрос — всё, что ядро знает о пользователе без обращения к базе
export interface AuthUser {
  id: string;
  role: Role;
}

export type TokenCheck =
  | { status: 'none' }
  | { status: 'valid'; user: AuthUser }
  | { status: 'expired' }
  | { status: 'invalid' };

// Ответы на проблемы с access-токеном — одинаковые для guard и прокси
export const AUTH_FAILURES = {
  none: { code: 'UNAUTHORIZED', message: 'Нужно войти в систему' },
  expired: { code: 'TOKEN_EXPIRED', message: 'Токен истёк: обновите его через /api/auth/refresh' },
  invalid: { code: 'TOKEN_INVALID', message: 'Недействительный токен' },
} as const;

// Access-токен: короткоживущий JWT, проверяется без базы
@Injectable()
export class TokensService {
  constructor(private readonly jwt: JwtService) {}

  signAccess(user: AuthUser): string {
    return this.jwt.sign({ sub: user.id, role: user.role });
  }

  check(req: Request): TokenCheck {
    const token = extractAccessToken(req);
    if (!token) return { status: 'none' };
    try {
      const payload = this.jwt.verify<{ sub: string; role: Role }>(token);
      return { status: 'valid', user: { id: payload.sub, role: payload.role } };
    } catch (error) {
      return error instanceof TokenExpiredError ? { status: 'expired' } : { status: 'invalid' };
    }
  }
}

// Bearer важнее cookie: так curl и тесты не зависят от состояния браузера
export function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim() || undefined;
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[ACCESS_COOKIE] || undefined;
}
