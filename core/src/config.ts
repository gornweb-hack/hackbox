// Настройки ядра берутся только из переменных окружения.
// Для запуска без Docker их можно положить в core/.env.
try {
  process.loadEnvFile();
} catch {
  // .env необязателен: в Docker переменные задаёт compose
}

const env = process.env;

export const config = {
  port: Number(env.PORT ?? 4000),
  databaseUrl: env.DATABASE_URL ?? '',
  // Папка content/ со сценариями и справочниками. Без Docker ядро запускается из core/
  contentDir: env.CONTENT_DIR ?? '../content',
  events: {
    redisUrl: env.REDIS_URL ?? 'redis://localhost:6379',
    // Через сколько миллисекунд необработанное событие забирается на повтор
    retryMs: Number(env.EVENTS_RETRY_MS ?? 30_000),
    // После стольких попыток событие уходит в events:dlq
    maxAttempts: 5,
  },
  auth: {
    jwtSecret: env.JWT_SECRET ?? 'dev-secret-change-me',
    // Формат jsonwebtoken: 15m, 2h, 1d или число секунд
    accessTtl: env.ACCESS_TTL ?? '15m',
    refreshTtlDays: Number(env.REFRESH_TTL_DAYS ?? 30),
    // Сколько миллисекунд после ротации старый refresh-токен ещё принимается
    refreshGraceMs: 30_000,
    registrationOpen: env.REGISTRATION_OPEN === 'true',
    adminLogin: env.ADMIN_LOGIN ?? 'admin',
    adminPassword: env.ADMIN_PASSWORD ?? 'admin123',
    seedDemoUsers: env.SEED_DEMO_USERS === 'true',
  },
};
