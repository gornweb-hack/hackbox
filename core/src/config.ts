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
};

// Адрес модуля: по умолчанию сервис compose, для модуля на хосте — MODULE_URL_<NAME>
export function moduleUrl(name: string): string {
  return env[`MODULE_URL_${name.toUpperCase()}`] ?? `http://${name}:8080`;
}
