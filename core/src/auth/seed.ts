import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import type { Role } from '../generated/prisma/client.js';
import { type NewUser, UsersService } from '../users/users.service.js';

const MOSCOW = 'Депо Москва-ВСМ';
const SPB = 'Депо Санкт-Петербург-ВСМ';

// Бригада демо-сотрудника user: он шестой, как «из 6» в макете рейтинга
const DEMO_CREW = { crew: 'Бригада 3', depot: MOSCOW };

// Синтетический штат для рейтинга и демо-истории: две депо, шесть бригад по шесть человек.
// Имена вымышленные (152-ФЗ). Войти под ними нельзя — пароль случайный, при необходимости его задаёт админ
const STAFF: { crew: string; depot: string; names: string[] }[] = [
  { crew: 'Бригада 1', depot: MOSCOW, names: ['Анна Соколова', 'Павел Жуков', 'Марина Ким', 'Сергей Белов', 'Елена Васильева', 'Никита Фролов'] },
  { crew: 'Бригада 2', depot: MOSCOW, names: ['Алия Хасанова', 'Роман Титов', 'Ксения Миронова', 'Андрей Поляков', 'Светлана Егорова', 'Максим Абрамов'] },
  { crew: 'Бригада 3', depot: MOSCOW, names: ['Иван Морозов', 'Ольга Лебедева', 'Дмитрий Орлов', 'Наталья Громова', 'Артём Кузнецов'] },
  { crew: 'Бригада 4', depot: MOSCOW, names: ['Екатерина Волкова', 'Тимур Галиев', 'Юлия Никитина', 'Константин Зайцев', 'Дарья Белоусова', 'Георгий Осипов'] },
  { crew: 'Бригада 5', depot: SPB, names: ['Виктория Лаптева', 'Олег Смирнов', 'Зарина Алиева', 'Илья Карпов', 'Полина Сидорова', 'Вадим Королёв'] },
  { crew: 'Бригада 6', depot: SPB, names: ['Алексей Тихонов', 'Мария Филиппова', 'Руслан Ахмедов', 'Татьяна Козлова', 'Григорий Назаров', 'Анастасия Орехова'] },
];

function staffAccounts(): NewUser[] {
  const names = STAFF.flatMap(({ crew, depot, names: list }) => list.map((name) => ({ name, crew, depot })));
  return names.map((member, index) => ({
    ...member,
    login: `staff-${String(index + 1).padStart(2, '0')}`,
    password: randomUUID(),
    role: 'USER' as Role,
  }));
}

// Аккаунты при старте: админ всегда; демо-аккаунты по ролям и синтетический штат — при SEED_DEMO_USERS=true.
// Создаются, только если их ещё нет; существующие (и сменённые пароли) не трогаются
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly users: UsersService) {}

  async onApplicationBootstrap(): Promise<void> {
    const accounts: NewUser[] = [
      { login: config.auth.adminLogin, password: config.auth.adminPassword, name: 'Администратор', role: 'ADMIN' },
    ];
    if (config.auth.seedDemoUsers) {
      accounts.push(
        { login: 'manager', password: 'manager123', name: 'Демо-руководитель', role: 'MANAGER' },
        { login: 'user', password: 'user123', name: 'Демо-сотрудник', role: 'USER', ...DEMO_CREW },
        ...staffAccounts(),
      );
    }

    let created = 0;
    for (const account of accounts) {
      try {
        const existing = await this.users.findByLogin(account.login);
        // Демо-сотрудник из базы, созданной до появления бригад, получает бригаду; заданную вручную не трогаем
        if (existing && account.login === 'user' && !existing.crew) await this.users.update(existing.id, DEMO_CREW);
        if (existing) continue;
        await this.users.create(account);
        created += 1;
      } catch (error) {
        // Ядро должно подняться, даже если база на секунду недоступна
        this.logger.warn(`не удалось создать аккаунт ${account.login}: ${String(error)}`);
      }
    }
    if (created) this.logger.log(`создано аккаунтов: ${created}`);
  }
}
