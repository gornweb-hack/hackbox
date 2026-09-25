import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { TokensService } from './tokens.js';

const user = {
  id: '0190c0de-0000-7000-8000-000000000001',
  login: 'user',
  name: 'Демо',
  email: null,
  passwordHash: 'x',
  role: 'USER' as const,
  createdAt: new Date(),
};

describe('AuthService.refresh — ротация с запасом', () => {
  let prisma: {
    refreshToken: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  };
  let auth: AuthService;

  const record = (revokedAgoMs: number | null, expiresInMs = 60_000) => ({
    id: 'rt-1',
    userId: user.id,
    tokenHash: 'h',
    expiresAt: new Date(Date.now() + expiresInMs),
    revokedAt: revokedAgoMs === null ? null : new Date(Date.now() - revokedAgoMs),
    createdAt: new Date(),
    user,
  });

  beforeEach(() => {
    prisma = {
      refreshToken: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    };
    const tokens = new TokensService(new JwtService({ secret: 's', signOptions: { expiresIn: '15m' } }));
    auth = new AuthService(prisma as unknown as PrismaService, {} as UsersService, tokens);
  });

  it('действующий токен отзывается и выдаётся новая пара', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(record(null));
    const session = await auth.refresh('old');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(expect.objectContaining({ data: { revokedAt: expect.any(Date) } }));
    expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
    expect(session.refreshToken).not.toBe('old');
    expect(session.accessToken).toBeTruthy();
  });

  it('отозванный недавно (в пределах запаса) — принимается повторно', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(record(config.auth.refreshGraceMs / 2));
    await expect(auth.refresh('old')).resolves.toMatchObject({ user: { id: user.id } });
    expect(prisma.refreshToken.update).not.toHaveBeenCalled();
  });

  it('отозванный давно — REFRESH_INVALID', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(record(config.auth.refreshGraceMs + 1_000));
    await expect(auth.refresh('old')).rejects.toMatchObject({ response: { code: 'REFRESH_INVALID' } });
  });

  it('истёкший или неизвестный — REFRESH_INVALID', async () => {
    prisma.refreshToken.findUnique.mockResolvedValueOnce(record(null, -1_000)).mockResolvedValueOnce(null);
    await expect(auth.refresh('old')).rejects.toMatchObject({ response: { code: 'REFRESH_INVALID' } });
    await expect(auth.refresh('unknown')).rejects.toMatchObject({ response: { code: 'REFRESH_INVALID' } });
    await expect(auth.refresh(undefined)).rejects.toMatchObject({ response: { code: 'REFRESH_INVALID' } });
  });

  it('выход отзывает токен «в прошлом», чтобы запас на него не действовал', async () => {
    await auth.logout('some');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { revokedAt: new Date(0) } }));
  });
});
