import { defineConfig } from 'prisma/config';

// Для запуска без Docker переменные можно положить в core/.env
try {
  process.loadEnvFile();
} catch {
  // .env необязателен: в Docker переменные задаёт compose
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
