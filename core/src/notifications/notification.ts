import type { EventEnvelope } from '../events/envelope.js';

// Правила центра уведомлений без базы: кому достаётся уведомление и что из события сохраняется

export const LEVELS = ['info', 'success', 'warning'] as const;
export type Level = (typeof LEVELS)[number];

export interface NotificationContent {
  title: string;
  message: string;
  level: Level;
}

// Адресное — одному сотруднику, broadcast — всем, кто есть в базе. Событие без адресата ядро
// отправляет в DLQ раньше (EventsConsumer.handle), сюда оно не доходит, но и сохранять его некому
export function recipientsOf(event: Pick<EventEnvelope, 'userId' | 'broadcast'>, everyone: string[]): string[] {
  if (event.broadcast) return everyone;
  return event.userId ? [event.userId] : [];
}

// data события приходит от любого модуля: пустой заголовок и неизвестный уровень не ломают список
export function contentOf(data: unknown): NotificationContent {
  const { title, message, level } = (data ?? {}) as Record<string, unknown>;
  return {
    title: typeof title === 'string' && title.trim() ? title : 'Уведомление',
    message: typeof message === 'string' ? message : '',
    level: LEVELS.includes(level as Level) ? (level as Level) : 'info',
  };
}
