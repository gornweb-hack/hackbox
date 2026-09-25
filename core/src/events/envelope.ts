import { randomUUID } from 'node:crypto';

// Общий стрим событий всех сервисов и стрим для событий, которые не удалось обработать
export const EVENTS_STREAM = 'events';
export const DLQ_STREAM = 'events:dlq';
// Стрим обрезается примерно до стольких записей, чтобы Redis не рос бесконечно
export const STREAM_MAX_LEN = '10000';

// Конверт события — одинаковый для всех языков (docs/module-contract.md, раздел «События»)
export interface EventEnvelope<T = unknown> {
  id: string;
  type: string;
  source: string;
  time: string;
  userId?: string;
  broadcast?: boolean;
  requestId?: string;
  data: T;
}

export interface PublishOptions {
  userId?: string;
  broadcast?: boolean;
  requestId?: string;
}

export function createEnvelope<T>(type: string, data: T, source: string, options: PublishOptions = {}): EventEnvelope<T> {
  const envelope: EventEnvelope<T> = { id: randomUUID(), type, source, time: new Date().toISOString(), data };
  if (options.userId) envelope.userId = options.userId;
  if (options.broadcast) envelope.broadcast = true;
  if (options.requestId) envelope.requestId = options.requestId;
  return envelope;
}

// Запись стрима: поле type (чтобы фильтровать в redis-cli) и поле event с JSON конверта
export function toStreamFields(envelope: EventEnvelope): string[] {
  return ['type', envelope.type, 'event', JSON.stringify(envelope)];
}

export function fromStreamFields(fields: string[] | null): EventEnvelope {
  const values = new Map<string, string>();
  for (let i = 0; fields && i + 1 < fields.length; i += 2) values.set(fields[i], fields[i + 1]);
  const raw = values.get('event');
  if (!raw) throw new Error('в записи нет поля event');
  const envelope = JSON.parse(raw) as Partial<EventEnvelope>;
  if (typeof envelope.id !== 'string' || typeof envelope.type !== 'string') {
    throw new Error('в конверте нет id или type');
  }
  return envelope as EventEnvelope;
}

// Кому из подключённых к SSE показывать событие
export function isFor(envelope: EventEnvelope, userId: string): boolean {
  return envelope.broadcast === true || envelope.userId === userId;
}
