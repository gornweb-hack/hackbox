import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { EventEnvelope } from '../events/envelope.js';
import { EventsConsumer } from '../events/events.consumer.js';
import { EventsService } from '../events/events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { contentOf, type Level, recipientsOf } from './notification.js';

// Сколько последних уведомлений отдаёт список
const LIST_LIMIT = 50;

export interface NotificationView {
  id: string;
  title: string;
  message: string;
  level: Level;
  createdAt: Date;
  readAt: Date | null;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly consumer: EventsConsumer,
    private readonly users: UsersService,
  ) {}

  onModuleInit(): void {
    this.consumer.on('notification.requested', (event) => this.save(event));
  }

  // Обработчик notification.requested: строка каждому получателю, повтор события отсекается уникальной
  // парой (eventId, userId). Тост браузер показывает сам, а после записи уходит notifications.updated —
  // чтобы список перечитали, когда новая строка уже в базе
  async save(event: EventEnvelope): Promise<void> {
    const everyone = event.broadcast ? (await this.users.list(undefined, false)).items.map((user) => user.id) : [];
    const userIds = recipientsOf(event, everyone);
    if (userIds.length === 0) return;

    const content = contentOf(event.data);
    const createdAt = new Date(event.time);
    const { count } = await this.prisma.notificationItem.createMany({
      data: userIds.map((userId) => ({ eventId: event.id, userId, ...content, createdAt })),
      skipDuplicates: true,
    });
    if (count === 0) return;
    await this.events.publish('notifications.updated', {}, event.broadcast ? { broadcast: true } : { userId: userIds[0] });
  }

  // Последние уведомления вошедшего, сколько всего и сколько не прочитано — для колокольчика и страницы
  async list(userId: string): Promise<{ items: NotificationView[]; total: number; unread: number }> {
    const [rows, total, unread] = await Promise.all([
      this.prisma.notificationItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
        select: { id: true, title: true, message: true, level: true, createdAt: true, readAt: true },
      }),
      this.prisma.notificationItem.count({ where: { userId } }),
      this.prisma.notificationItem.count({ where: { userId, readAt: null } }),
    ]);
    return { items: rows.map((row) => ({ ...row, level: row.level as Level })), total, unread };
  }

  // Все уведомления вошедшего — прочитаны. Остальные вкладки узнают об этом из notifications.updated
  async markRead(userId: string): Promise<{ unread: number }> {
    const { count } = await this.prisma.notificationItem.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    if (count > 0) await this.events.publish('notifications.updated', {}, { userId });
    return { unread: 0 };
  }
}
