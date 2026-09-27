import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config.js';
import { createEnvelope, DLQ_STREAM, type EventEnvelope, EVENTS_STREAM, toStreamFields } from './envelope.js';
import { entriesOf, EventsConsumer } from './events.consumer.js';

// Подменный Redis: отвечает на команды из таблицы и запоминает вызовы
function fakeRedis(replies: Record<string, unknown> = {}) {
  const call = vi.fn(async (command: string, ...args: string[]) => {
    const reply = replies[command];
    if (reply instanceof Error) throw reply;
    return typeof reply === 'function' ? (reply as (...a: string[]) => unknown)(...args) : (reply ?? 'OK');
  });
  return { call, connect: vi.fn(async () => undefined), disconnect: vi.fn() };
}

const commands = (redis: ReturnType<typeof fakeRedis>, name: string) =>
  redis.call.mock.calls.filter(([command]) => command === name).map(([, ...args]) => args);

describe('entriesOf — ответ XREADGROUP', () => {
  const entries = [['1-0', ['type', 'a.b', 'event', '{}']]];

  it('RESP2: [[stream, entries]]', () => {
    expect(entriesOf([['events', entries]])).toEqual(entries);
  });

  it('RESP3 в ioredis: [stream, entries]', () => {
    expect(entriesOf(['events', entries])).toEqual(entries);
  });

  it('таймаут BLOCK (null) и пустые ответы — нет записей', () => {
    expect(entriesOf(null)).toEqual([]);
    expect(entriesOf([])).toEqual([]);
    expect(entriesOf(['events'])).toEqual([]);
  });
});

describe('EventsConsumer', () => {
  let consumer: EventsConsumer;
  let redis: ReturnType<typeof fakeRedis>;
  let delivered: EventEnvelope[];

  const use = (fake: ReturnType<typeof fakeRedis>) => {
    redis = fake;
    (consumer as unknown as { redis: unknown }).redis = fake;
  };

  beforeEach(() => {
    consumer = new EventsConsumer();
    delivered = [];
    consumer.deliveries.subscribe((event) => delivered.push(event));
    use(fakeRedis());
  });

  it('событие для пользователя уходит в SSE и подтверждается', async () => {
    const event = createEnvelope('points.awarded', { points: 50 }, 'points', { userId: 'u1' });
    await consumer.process('1-0', toStreamFields(event));
    expect(delivered).toEqual([event]);
    expect(commands(redis, 'XACK')).toEqual([[EVENTS_STREAM, 'core', '1-0']]);
  });

  it('событие без адресата подтверждается, но в SSE не уходит', async () => {
    await consumer.process('1-0', toStreamFields(createEnvelope('user.created', {}, 'core')));
    expect(delivered).toEqual([]);
    expect(commands(redis, 'XACK')).toHaveLength(1);
  });

  it('ошибка обработки — без XACK, событие остаётся в ожидании', async () => {
    const broken = createEnvelope('notification.requested', { title: 'x' }, 'points');
    await consumer.process('1-0', toStreamFields(broken));
    expect(commands(redis, 'XACK')).toEqual([]);
  });

  it('обработчик модуля получает событие своего типа, чужие — нет', async () => {
    const received: string[] = [];
    consumer.on('scenario.completed', async (event) => {
      received.push(event.type);
    });
    await consumer.process('1-0', toStreamFields(createEnvelope('scenario.completed', {}, 'core', { userId: 'u1' })));
    await consumer.process('2-0', toStreamFields(createEnvelope('user.created', {}, 'core')));
    expect(received).toEqual(['scenario.completed']);
    expect(commands(redis, 'XACK')).toHaveLength(2);
  });

  it('ошибка обработчика модуля — без XACK, событие придёт снова', async () => {
    consumer.on('scenario.completed', async () => {
      throw new Error('база недоступна');
    });
    await consumer.process('1-0', toStreamFields(createEnvelope('scenario.completed', {}, 'core', { userId: 'u1' })));
    expect(commands(redis, 'XACK')).toEqual([]);
  });

  it('нечитаемая запись сразу уходит в DLQ', async () => {
    await consumer.process('1-0', ['type', 'x', 'event', 'not json']);
    expect(commands(redis, 'XADD')[0].slice(0, 1)).toEqual([DLQ_STREAM]);
    expect(commands(redis, 'XACK')).toHaveLength(1);
  });

  it('повтор: зависшее событие забирается и обрабатывается заново', async () => {
    const event = createEnvelope('points.awarded', {}, 'points', { userId: 'u1' });
    use(fakeRedis({ XPENDING: [['1-0', 'old-host', 40_000, 2]], XCLAIM: [['1-0', toStreamFields(event)]] }));
    await consumer.retryPending();
    expect(delivered).toEqual([event]);
    expect(commands(redis, 'XACK')).toHaveLength(1);
  });

  it('после maxAttempts попыток событие уходит в DLQ с текстом последней ошибки', async () => {
    const broken = toStreamFields(createEnvelope('notification.requested', {}, 'points'));
    await consumer.process('1-0', broken);
    use(fakeRedis({ XPENDING: [['1-0', 'host', 40_000, config.events.maxAttempts]], XCLAIM: [['1-0', broken]] }));
    await consumer.retryPending();
    const dlq = commands(redis, 'XADD')[0];
    expect(dlq[0]).toBe(DLQ_STREAM);
    expect(dlq.join(' ')).toContain('некому показывать');
    expect(commands(redis, 'XACK')).toEqual([[EVENTS_STREAM, 'core', '1-0']]);
  });

  it('группа уже есть (BUSYGROUP) — не ошибка; другие ошибки пробрасываются', async () => {
    use(fakeRedis({ XGROUP: new Error('BUSYGROUP Consumer Group name already exists') }));
    await expect(consumer.ensureGroup()).resolves.toBeUndefined();
    const other = new EventsConsumer();
    (other as unknown as { redis: unknown }).redis = fakeRedis({ XGROUP: new Error('NOAUTH') });
    await expect(other.ensureGroup()).rejects.toThrow('NOAUTH');
  });
});
