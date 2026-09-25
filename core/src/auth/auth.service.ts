import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { ApiError } from '../common/api-error.js';
import { config } from '../config.js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toProfile, type UserProfile, UsersService } from '../users/users.service.js';
import { verifyPassword } from './password.js';
import { TokensService } from './tokens.js';

export interface Session {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

const REFRESH_INVALID = () => new ApiError(401, 'REFRESH_INVALID', 'Сессия истекла, войдите заново');

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly tokens: TokensService,
  ) {}

  async login(login: string, password: string): Promise<Session> {
    const user = await this.users.findByLogin(login);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Неверный логин или пароль');
    }
    return this.issue(user);
  }

  async register(data: { login: string; password: string; name: string; email?: string }): Promise<Session> {
    if (!config.auth.registrationOpen) {
      throw new ApiError(403, 'REGISTRATION_CLOSED', 'Регистрация закрыта: аккаунт заводит администратор');
    }
    return this.issue(await this.users.create({ ...data, role: 'USER' }));
  }

  // Ротация с запасом: старый токен отзывается, но ещё refreshGraceMs принимается —
  // две вкладки или повтор запроса при плохой связи не выкидывают пользователя
  async refresh(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken) throw REFRESH_INVALID();
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    const now = Date.now();
    if (!record || record.expiresAt.getTime() <= now) throw REFRESH_INVALID();
    if (record.revokedAt && now - record.revokedAt.getTime() > config.auth.refreshGraceMs) throw REFRESH_INVALID();

    if (!record.revokedAt) {
      await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date(now) } });
    }
    return this.issue(record.user);
  }

  // Выход: токен отзывается «в прошлом», чтобы запас после ротации на него не действовал
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken) },
      data: { revokedAt: new Date(0) },
    });
  }

  private async issue(user: User): Promise<Session> {
    const refreshToken = randomBytes(32).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + config.auth.refreshTtlDays * 86_400_000),
      },
    });
    return { user: toProfile(user), accessToken: this.tokens.signAccess(user), refreshToken };
  }
}
