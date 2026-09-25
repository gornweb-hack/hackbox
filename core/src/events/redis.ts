import type { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { config } from '../config.js';

// Подключение к Redis. Без очереди офлайн-команд: пока Redis лежит, команды падают сразу,
// а не копятся и не вешают вызывающий код. Переподключение — само, раз в 0,5–5 с
export function createRedis(name: string, logger: Logger): Redis {
  const redis = new Redis(config.events.redisUrl, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectionName: `core-${name}`,
    retryStrategy: (attempt) => Math.min(attempt * 500, 5_000),
  });

  // Пишем в лог только смену состояния, а не каждую неудачную попытку
  let down = false;
  redis.on('ready', () => {
    if (down) logger.log(`Redis (${name}): связь восстановлена`);
    down = false;
  });
  redis.on('error', (error: Error) => {
    if (!down) logger.warn(`Redis (${name}) недоступен: ${error.message}`);
    down = true;
  });
  return redis;
}
