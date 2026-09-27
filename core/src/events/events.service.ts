import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import {
  createEnvelope,
  EVENTS_STREAM,
  type PublishOptions,
  STREAM_MAX_LEN,
  toStreamFields,
} from './envelope.js';
import { createRedis } from './redis.js';

// Публикация событий ядра. «Лучшее усилие»: если Redis лежит, событие теряется
// с предупреждением в логе, а вход и сотрудники продолжают работать
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private readonly redis = createRedis('publisher', this.logger);

  onModuleInit(): void {
    this.redis.connect().catch(() => undefined);
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }

  isUp(): boolean {
    return this.redis.status === 'ready';
  }

  async publish<T>(type: string, data: T, options: PublishOptions = {}): Promise<void> {
    const envelope = createEnvelope(type, data, 'core', options);
    try {
      await this.redis.call('XADD', EVENTS_STREAM, 'MAXLEN', '~', STREAM_MAX_LEN, '*', ...toStreamFields(envelope));
    } catch (error) {
      this.logger.warn(`событие ${type} не отправлено: ${(error as Error).message}`);
    }
  }
}
