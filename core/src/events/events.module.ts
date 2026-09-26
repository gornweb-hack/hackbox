import { Global, Module } from '@nestjs/common';
import { EventsConsumer } from './events.consumer.js';
import { EventsService } from './events.service.js';
import { StreamController } from './stream.controller.js';

// События: публикация в стрим events, чтение группой core и SSE /api/stream.
// Глобальный: публиковать события может любой модуль
@Global()
@Module({
  controllers: [StreamController],
  providers: [EventsService, EventsConsumer],
  exports: [EventsService],
})
export class EventsModule {}
