import { Controller, type MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { filter, interval, map, merge, type Observable } from 'rxjs';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { isFor } from './envelope.js';
import { EventsConsumer } from './events.consumer.js';

// Как часто слать ping, чтобы прокси не закрывали «молчащее» соединение
const PING_MS = 25_000;

@Controller()
export class StreamController {
  constructor(private readonly consumer: EventsConsumer) {}

  // SSE: события пользователя и broadcast-события (data — конверт события)
  // и ping (именованное событие, onmessage его не видит)
  @Sse('stream')
  @UseGuards(AuthGuard)
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    const events = this.consumer.deliveries.pipe(
      filter((event) => isFor(event, user.id)),
      map((event) => ({ data: event })),
    );
    const pings = interval(PING_MS).pipe(map(() => ({ type: 'ping', data: '' })));
    return merge(events, pings);
  }
}
