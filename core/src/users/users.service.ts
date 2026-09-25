import { Injectable } from '@nestjs/common';
import { hashPassword } from '../auth/password.js';
import { ApiError } from '../common/api-error.js';
import { EventsService } from '../events/events.service.js';
import type { Role, User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface UserProfile {
  id: string;
  login: string;
  name: string;
  email: string | null;
  role: Role;
  createdAt: Date;
}

export interface NewUser {
  login: string;
  password: string;
  name: string;
  email?: string;
  role?: Role;
}

export interface UserChanges {
  name?: string;
  email?: string;
  role?: Role;
  password?: string;
}

// Логин и email сравниваются без учёта регистра и пробелов по краям
export const normalize = (value: string): string => value.trim().toLowerCase();

export function toProfile(user: User): UserProfile {
  const { id, login, name, email, role, createdAt } = user;
  return { id, login, name, email, role, createdAt };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  findByLogin(login: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { login: normalize(login) } });
  }

  async profile(id: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user && toProfile(user);
  }

  // Публичные поля {id, name, role} — например, чтобы подписать рейтинг именами.
  // С full = true (для админа) — ещё login, email и createdAt
  async list(
    ids: string[] | undefined,
    full: boolean,
  ): Promise<{ items: (Pick<User, 'id' | 'name' | 'role'> & Partial<UserProfile>)[]; total: number }> {
    const items = await this.prisma.user.findMany({
      where: ids ? { id: { in: ids } } : undefined,
      select: { id: true, name: true, role: true, ...(full && { login: true, email: true, createdAt: true }) },
      orderBy: { name: 'asc' },
    });
    return { items, total: items.length };
  }

  async create(data: NewUser): Promise<User> {
    const login = normalize(data.login);
    const email = data.email ? normalize(data.email) : null;
    await this.ensureFree(login, email);
    const user = await this.prisma.user.create({
      data: { login, email, name: data.name.trim(), role: data.role, passwordHash: await hashPassword(data.password) },
    });
    // Модули могут держать у себя копию имён — например, для рейтинга
    await this.events.publish('user.created', { id: user.id, name: user.name, role: user.role });
    return user;
  }

  async update(id: string, changes: UserChanges): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Пользователь не найден');

    const email = changes.email === undefined ? undefined : normalize(changes.email);
    if (email && email !== user.email) await this.ensureFree(null, email);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: changes.name?.trim(),
        email,
        role: changes.role,
        passwordHash: changes.password ? await hashPassword(changes.password) : undefined,
      },
    });
    await this.events.publish('user.updated', { id: updated.id, name: updated.name, role: updated.role });
    return toProfile(updated);
  }

  private async ensureFree(login: string | null, email: string | null): Promise<void> {
    if (login && (await this.prisma.user.findUnique({ where: { login } }))) {
      throw new ApiError(409, 'LOGIN_TAKEN', 'Такой логин уже занят');
    }
    if (email && (await this.prisma.user.findUnique({ where: { email } }))) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Такой email уже занят');
    }
  }
}
