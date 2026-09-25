import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { config } from '../config.js';
import type { Role } from '../generated/prisma/client.js';
import { UsersService } from '../users/users.service.js';

// Аккаунты при старте: админ всегда, демо-аккаунты по ролям — при SEED_DEMO_USERS=true.
// Создаются, только если их ещё нет; существующие (и сменённые пароли) не трогаются
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly users: UsersService) {}

  async onApplicationBootstrap(): Promise<void> {
    const accounts: { login: string; password: string; name: string; role: Role }[] = [
      { login: config.auth.adminLogin, password: config.auth.adminPassword, name: 'Администратор', role: 'ADMIN' },
    ];
    if (config.auth.seedDemoUsers) {
      accounts.push(
        { login: 'manager', password: 'manager123', name: 'Демо-руководитель', role: 'MANAGER' },
        { login: 'user', password: 'user123', name: 'Демо-сотрудник', role: 'USER' },
      );
    }

    for (const account of accounts) {
      try {
        if (await this.users.findByLogin(account.login)) continue;
        await this.users.create(account);
        this.logger.log(`создан аккаунт ${account.login} (${account.role})`);
      } catch (error) {
        // Ядро должно подняться, даже если база на секунду недоступна
        this.logger.warn(`не удалось создать аккаунт ${account.login}: ${String(error)}`);
      }
    }
  }
}
