import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { hostname } from 'node:os';
import { Subject } from 'rxjs';
import { config } from '../config.js';
import { DLQ_STREAM, EVENTS_STREAM, type EventEnvelope, fromStreamFields, STREAM_MAX_LEN } from './envelope.js';
import { createRedis } from './redis.js';

type StreamEntry = [id: string, fields: string[] | null];

const GROUP = 'core';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Записи из ответа XREADGROUP по одному стриму. По RESP2 ответ — [[stream, entries]],
// по RESP3 (ioredis 6 + Redis 8) — карта, которую ioredis разворачивает в [stream, entries]
export function entriesOf(reply: unknown): StreamEntry[] {
  if (!Array.isArray(reply) || reply.length === 0) return [];
  const pair: unknown[] = Array.isArray(reply[0]) ? reply[0] : reply;
  return Array.isArray(pair[1]) ? (pair[1] as StreamEntry[]) : [];
}

// Читатель событий ядра (группа core). Это же образец алгоритма для хелперов Go и Python:
// XREADGROUP → обработка → XACK; упавшие события — повтор через XPENDING + XCLAIM,
// после maxAttempts попыток — в events:dlq
@Injectable()
export class EventsConsumer implements OnApplicationBootstrap, OnModuleDestroy {
  // Сюда попадают события для пользователей — их раздаёт SSE
  readonly deliveries = new Subject<EventEnvelope>();

  private readonly logger = new Logger(EventsConsumer.name);
  private readonly consumer = hostname();
  // Отдельное подключение: XREADGROUP с BLOCK занимает его на время ожидания
  private redis: Pick<Redis, 'call' | 'connect' | 'disconnect'> = createRedis('consumer', this.logger);
  private readonly lastErrors = new Map<string, string>();
  private running = false;
  private groupReady = false;

  onApplicationBootstrap(): void {
    this.running = true;
    // Цикл стартует после попытки подключения — иначе первое чтение падает с ложной ошибкой.
    // Если Redis лежит, цикл сам ждёт и повторяет
    const start = () => void this.run();
    this.redis.connect().then(start, start);
  }

  onModuleDestroy(): void {
    this.running = false;
    this.redis.disconnect();
  }

  // Что ядро делает с событием. Бросить исключение = не подтвердить, событие повторится
  handle(event: EventEnvelope): void {
    if (event.type === 'notification.requested' && !event.userId && !event.broadcast) {
      throw new Error('notification.requested без userId и без broadcast: некому показывать');
    }
    if (event.userId || event.broadcast) this.deliveries.next(event);
  }

  private async run(): Promise<void> {
    let lastRetry = 0;
    let lastError = '';
    while (this.running) {
      try {
        await this.ensureGroup();
        if (Date.now() - lastRetry >= config.events.retryMs) {
          await this.retryPending();
          lastRetry = Date.now();
        }
        const reply = await this.redis.call(
          'XREADGROUP', 'GROUP', GROUP, this.consumer, 'COUNT', '10', 'BLOCK', '5000', 'STREAMS', EVENTS_STREAM, '>',
        );
        for (const [id, fields] of entriesOf(reply)) await this.process(id, fields);
        lastError = '';
      } catch (error) {
        if (!this.running) return;
        // Redis лежит или потерял данные (NOGROUP) — подождём и пересоздадим группу.
        // Одну и ту же ошибку пишем в лог один раз, а не каждые 2 секунды
        const message = (error as Error).message;
        if (message !== lastError) this.logger.warn(`цикл событий: ${message}`);
        lastError = message;
        this.groupReady = false;
        await sleep(2_000);
      }
    }
  }

  // Группа создаётся с $: новый читатель получает только новые события
  async ensureGroup(): Promise<void> {
    if (this.groupReady) return;
    try {
      await this.redis.call('XGROUP', 'CREATE', EVENTS_STREAM, GROUP, '$', 'MKSTREAM');
    } catch (error) {
      if (!String((error as Error).message).includes('BUSYGROUP')) throw error;
    }
    this.groupReady = true;
  }

  async process(id: string, fields: string[] | null): Promise<void> {
    let event: EventEnvelope;
    try {
      event = fromStreamFields(fields);
    } catch (error) {
      // Нечитаемую запись повторять бессмысленно — сразу в DLQ
      await this.toDlq(id, fields, (error as Error).message);
      return;
    }
    try {
      this.handle(event);
      await this.redis.call('XACK', EVENTS_STREAM, GROUP, id);
      this.lastErrors.delete(id);
    } catch (error) {
      // Без XACK событие остаётся в ожидании и вернётся через retryPending
      this.lastErrors.set(id, (error as Error).message);
      this.logger.warn(`событие ${event.type} (${id}) не обработано: ${(error as Error).message}`);
    }
  }

  // Повтор зависших событий: забираем их себе (XCLAIM) и обрабатываем заново
  async retryPending(): Promise<void> {
    const pending = (await this.redis.call(
      'XPENDING', EVENTS_STREAM, GROUP, 'IDLE', String(config.events.retryMs), '-', '+', '10',
    )) as [id: string, consumer: string, idleMs: number, deliveries: number][];

    for (const [id, , , deliveries] of pending) {
      const claimed = (await this.redis.call(
        'XCLAIM', EVENTS_STREAM, GROUP, this.consumer, String(config.events.retryMs), id,
      )) as StreamEntry[];
      if (!claimed.length) continue; // успел забрать другой экземпляр
      const [, fields] = claimed[0];
      if (deliveries >= config.events.maxAttempts) {
        await this.toDlq(id, fields, this.lastErrors.get(id) ?? `не обработано за ${deliveries} попыток`);
      } else {
        await this.process(id, fields);
      }
    }
  }

  private async toDlq(id: string, fields: string[] | null, error: string): Promise<void> {
    await this.redis.call(
      'XADD', DLQ_STREAM, 'MAXLEN', '~', STREAM_MAX_LEN, '*',
      ...(fields ?? []), 'error', error, 'group', GROUP, 'sourceId', id,
    );
    await this.redis.call('XACK', EVENTS_STREAM, GROUP, id);
    this.lastErrors.delete(id);
    this.logger.warn(`событие ${id} отправлено в ${DLQ_STREAM}: ${error}`);
  }
}
