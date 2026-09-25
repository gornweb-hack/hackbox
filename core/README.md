# core — ядро hackbox

Nest.js 12 (ESM), Prisma 7, Node 24. Что делает ядро и какие у него эндпоинты, описано в [корневом README](../README.md#ядро).

## Запуск

Обычно ядро запускается вместе со всем проектом: `docker compose up -d --build` из корня.

Без Docker, с перезапуском при изменениях:

```bash
cp .env.example .env    # поправьте порт базы под свой POSTGRES_PORT
npm install
npm run start:dev
```

База при этом должна работать в Docker (`docker compose up -d postgres db-init` из корня). Модули, запущенные у вас на хосте, указываются через `MODULE_URL_<NAME>` в `.env`. Nest CLI 12 требует Node 24.15 или новее.

## Команды

| Команда | Что делает |
|---|---|
| `npm run build` | сборка в `dist/` |
| `npm test` | unit-тесты (vitest) |
| `npm run lint` | линтер (oxlint) |
| `npx prisma migrate dev --name <имя>` | новая миграция после правки `prisma/schema.prisma`: нужен `DATABASE_URL` на локальную базу, Prisma создаёт временную shadow-базу (у `core_svc` есть `CREATEDB`) |

## Устройство

| Путь | Что там |
|---|---|
| `src/main.ts` | запуск: прокси подключён до разбора тела запроса, поэтому JSON и файлы уходят в модуль как есть |
| `src/modules-registry/` | реестр модулей: опрос `/health` каждые 5 с, `GET /api/modules` |
| `src/proxy/module-proxy.ts` | прокси `/api/m/<name>/*`: 404, 503 без ожидания, 504 по таймауту; ставит модулю `X-User-Id` и `X-User-Role` |
| `src/auth/` | вход: `tokens.ts` (access-JWT из cookie или Bearer), `auth.service.ts` (вход, refresh с ротацией, выход, регистрация), `auth.guard.ts` (`AuthGuard`, `@Roles`, `@CurrentUser`), `password.ts` (scrypt), `seed.ts` (демо-аккаунты при старте) |
| `src/users/` | `GET /api/users`, `POST` и `PATCH /api/users` для админа |
| `src/health/` | `GET /api/health` с проверкой базы |
| `src/common/` | формат ошибок `{code, message}`, `503 DB_UNAVAILABLE` при недоступной базе, `X-Request-Id` |
| `prisma/schema.prisma` | схема ядра в `public`: `users`, `refresh_tokens`. Клиент генерируется в `src/generated/` при `npm install` |

Закрыть свой эндпоинт входом и ролью:

```ts
@Get('report')
@UseGuards(AuthGuard)
@Roles(['MANAGER', 'ADMIN'])
report(@CurrentUser() user: AuthUser) { ... }
```

Настройки берутся только из переменных окружения, см. `src/config.ts`. При старте контейнер применяет миграции (`prisma migrate deploy`).
