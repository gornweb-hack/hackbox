# События

События связывают модули ядра между собой и доставляют уведомления в браузер. Они идут через Redis Streams. Код — в `core/src/events/`.

## Как устроено

- **Один стрим `events`.** У записи два поля: `type` (по нему удобно фильтровать в `redis-cli`) и `event` с JSON конверта. Стрим обрезается примерно до 10 000 записей.
- **Публикует любой модуль** через `EventsService.publish`. Модуль событий глобальный, импортировать его не нужно.
- **Читает группа `core`** (`EventsConsumer`). События с `userId` или `broadcast: true` она отдаёт в браузер по SSE.
- **Повторы.** Если обработка упала, событие не подтверждается и через `EVENTS_RETRY_MS` (30 с) обрабатывается снова. После 5 попыток оно уходит в `events:dlq` с полями `error`, `group` и `sourceId`.
- **Группа создаётся «с текущего момента».** События, опубликованные до её первого запуска, она не увидит.

## Конверт

```json
{"id": "uuid", "type": "scenario.completed", "source": "core", "time": "2026-09-26T12:00:00.000Z",
 "userId": "uuid (необязательно)", "broadcast": false, "requestId": "…", "data": {…}}
```

| Поле | Что это |
|---|---|
| `id` | новый UUID на каждое событие, по нему отсекаются повторы |
| `type` | `<сущность>.<глагол в прошедшем времени>`: `scenario.completed`, `points.awarded` |
| `source` | кто опубликовал; у всех модулей ядра — `core` |
| `time` | время публикации, ISO 8601 в UTC |
| `userId` | кому адресовано: такое событие уйдёт в браузер этому сотруднику |
| `broadcast` | `true` — событие для всех вошедших |
| `requestId` | `X-Request-Id` запроса, который породил событие, если его передали |
| `data` | содержимое события |

Ненужные поля можно не передавать.

## Публикация

```ts
await this.events.publish(
  'notification.requested',
  { title: 'Новая ачивка', message: '«Первый рейс»', level: 'success' },
  { userId },
);
```

- **Сначала коммит в базу, потом публикация.** Иначе событие сообщит о том, чего в базе нет.
- **«Лучшее усилие».** Если Redis лежит, `publish` пишет предупреждение в лог и не бросает исключение. Основной запрос пользователя не падает, но событие теряется.
- **Новый тип события** дописывается в таблицу ниже.

## Обработка

Ядро обрабатывает события в `EventsConsumer.handle`: проверяет `notification.requested` и отдаёт адресованные события в SSE. Обработчик модуля, например начисление очков по `scenario.completed`, подключается туда же вместе с первым таким обработчиком.

Правила для обработчиков:
- **Идемпотентность.** Одно событие может прийти дважды. Повтор отсекается по `id` конверта или по смыслу, например уникальным ключом `run_id` в своей таблице.
- **Исключение означает «не обработано».** Событие не подтверждается и придёт снова.

## Доставка в браузер

- `GET /api/stream` — SSE только для вошедших. В `data` лежит конверт события. Раз в 25 с приходит именованное событие `ping`, чтобы соединение не рвалось: обработчик `onmessage` его не получает.
- На фронте одно подключение на всё приложение — `EventStreamProvider` в `web/src/lib/events.tsx`. Подписаться на свой тип можно хуком `useEvent("points.awarded", …)`.
- `notification.requested` фронт показывает тостом сам.

## Стандартные события

| Тип | Кто публикует | `data` | Что происходит |
|---|---|---|---|
| `notification.requested` | любой модуль | `{title, message, level: "info" \| "success" \| "warning"}` | тост в браузере. Нужен `userId` или `broadcast: true`, иначе событие уйдёт в DLQ |
| `user.created`, `user.updated` | вход и сотрудники (`UsersService`) | `{id, name, role}` | фронт перечитывает список сотрудников |
| `scenario.completed` | сценарии (`RunsService`), в финале прохождения | `{runId, scenarioId, category, outcome, loyalty, safety, timeouts, durationSec, finishedAt, decisions: [{nodeId, choiceId, timedOut, loyaltyDelta, safetyDelta}]}` | прохождение завершено. В конверте `userId` проводника, поэтому событие приходит и в его браузер. Его читают геймификация и аналитика |

## Ключи в Redis

Свои ключи модуля — только с префиксом `<модуль>:`, например `gamification:leaderboard`. Общие для всех только стримы `events` и `events:dlq`.

## Отладка

```bash
docker compose exec redis redis-cli -a redis_pass --no-auth-warning XRANGE events - +
```
```bash
docker compose exec redis redis-cli -a redis_pass --no-auth-warning XINFO GROUPS events
```
```bash
docker compose exec redis redis-cli -a redis_pass --no-auth-warning XPENDING events core
```
```bash
docker compose exec redis redis-cli -a redis_pass --no-auth-warning XRANGE events:dlq - +
```

По порядку: последние события; группы и их отставание (`lag`); неподтверждённые события группы `core`; события, которые не удалось обработать за 5 попыток.
