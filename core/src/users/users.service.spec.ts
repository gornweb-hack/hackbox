import { describe, expect, it, vi } from 'vitest';
import type { EventsService } from '../events/events.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService.list', () => {
  const findMany = vi.fn().mockResolvedValue([]);
  const service = new UsersService({ user: { findMany } } as unknown as PrismaService, {} as EventsService);

  it('обычному пользователю — только публичные поля, включая бригаду и депо', async () => {
    await service.list(undefined, false);
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ select: { id: true, name: true, role: true, crew: true, depot: true } }));
  });

  it('админу — ещё login, email и createdAt', async () => {
    await service.list(['a'], true);
    expect(findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: { in: ['a'] } },
        select: { id: true, name: true, role: true, crew: true, depot: true, login: true, email: true, createdAt: true },
      }),
    );
  });
});
