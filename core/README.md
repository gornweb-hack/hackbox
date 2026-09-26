# core — ядро hackbox

Nest.js 12 (ESM), Prisma 7, Node 24. Это весь бэкенд — одно приложение из модулей Nest. Что делает ядро и какие у него эндпоинты, описано в [корневом README](../README.md#ядро). Как добавить свой модуль — в [онбординге](../docs/onboarding.md).

## Запуск

Обычно ядро запускается вместе со всем проектом: `docker compose up -d --build` из корня.

Без Docker, с перезапуском при изменениях:

```bash
cp .env.example .env    # поправьте порт базы под свой POSTGRES_PORT
npm install
npm run start:dev
```

База и Redis при этом должны работать в Docker (`docker compose up -d postgres db-init redis` из корня), а контейнер ядра — быть остановлен (`docker compose stop core`), чтобы освободить порт 4000. Nest CLI 12 требует Node 24.15 или новее.

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
| `src/main.ts` | запуск: префикс `/api`, cookie, формат ошибок, валидация (`422 VALIDATION_ERROR`) |
| `src/app.module.ts` | список модулей приложения |
| `src/auth/` | `AuthModule` (`auth.module.ts`) — вход и сотрудники. Внутри: `tokens.ts` (access-JWT из cookie или Bearer), `auth.service.ts` (вход, refresh с ротацией, выход, регистрация), `auth.guard.ts` (`AuthGuard`, `@Roles`, `@CurrentUser`), `password.ts` (scrypt), `seed.ts` (демо-аккаунты при старте) |
| `src/users/` | часть `AuthModule`: `GET /api/users`, `POST` и `PATCH /api/users` для админа; публикует `user.created` и `user.updated` |
| `src/events/` | `EventsModule`: `events.service.ts` (публикация по принципу «лучшее усилие»), `events.consumer.ts` (группа `core`: чтение, повторы, DLQ; модули подписываются через `on`), `envelope.ts` (конверт), `stream.controller.ts` (SSE `/api/stream`), `redis.ts` (подключения). Правила — в [памятке по событиям](../docs/events.md) |
| `src/prisma/` | `PrismaModule`: одно подключение к базе на всё приложение |
| `src/health/` | `HealthModule`: `GET /api/health` с проверкой базы и статусом Redis |
| `src/scenarios/` | `ScenariosModule`: каталог из `content/scenarios/*.yaml` (файлы читаются при каждом запросе) и прохождения `/api/scenarios/runs`. `script.ts` — формат диалога, `engine.ts` — правила: шкалы, переходы, таймер. `runs.service.ts` хранит прохождения и в финале публикует `scenario.completed`. Формат — в [памятке по контенту](../docs/content.md) |
| `src/gamification/` | `GamificationModule`: подписан на `scenario.completed`, ведёт журнал `gamification_runs`. `rules.ts` — правила из `content/gamification.yaml`, `progress.ts` — опыт, уровень и репутация, `achievements.ts` — полученные ачивки, ачивки прохождения и прогресс к следующей. `GET /api/gamification/me/progress` и `GET /api/gamification/runs/:runId/reward`, события `progress.updated` и тосты о новом уровне и ачивках |
| `src/common/` | формат ошибок `{code, message}`, `503 DB_UNAVAILABLE` при недоступной базе, `X-Request-Id` |
| `prisma/schema.prisma` | схема в `public`: `users`, `refresh_tokens` и таблицы модулей. Клиент генерируется в `src/generated/` при `npm install`. Правила — в [памятке по базе](../docs/database.md) |

Закрыть свой эндпоинт входом и ролью:

```ts
@Get('report')
@UseGuards(AuthGuard)
@Roles(['MANAGER', 'ADMIN'])
report(@CurrentUser() user: AuthUser) { ... }
```

Опубликовать событие из своего кода ядра:

```ts
await this.events.publish('notification.requested', { title: 'Баллы', message: '+50', level: 'success' }, { userId });
```

Настройки берутся только из переменных окружения, см. `src/config.ts`. При старте контейнер применяет миграции (`prisma migrate deploy`).
