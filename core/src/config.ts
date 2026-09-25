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
  // Модули через запятую — тот же список, что у db-init
  modules: (env.MODULES ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean),
  moduleTimeoutMs: Number(env.MODULE_TIMEOUT_MS ?? 10_000),
  healthIntervalMs: 5_000,
  healthTimeoutMs: 1_000,
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

// Адрес модуля: по умолчанию сервис compose, для модуля на хосте — MODULE_URL_<NAME>
export function moduleUrl(name: string): string {
  return env[`MODULE_URL_${name.toUpperCase()}`] ?? `http://${name}:8080`;
}
