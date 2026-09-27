# Диаграммы последовательности

Главный путь — одно прохождение сценария — в [README](../README.md#путь-одного-прохождения) рядом со схемой компонентов. Здесь — три служебных пути, на которых держится демо: вход, уведомления и надёжная доставка событий. Картинки для слайдов — в [docs/diagrams/](diagrams/), PDF со схемой компонентов и путём прохождения — [gornweb.online/architecture.pdf](https://gornweb.online/architecture.pdf) (файл `web/public/architecture.pdf`).

## Вход и обновление токена

Access-токен живёт 15 минут, refresh — дни. Браузер не видит токенов: оба лежат в httpOnly-cookie, в базе — только хэш refresh-токена.

```mermaid
sequenceDiagram
  actor user as Проводник
  participant web as web (api.ts)
  participant auth as core · auth
  participant db as Postgres

  user->>web: логин и пароль
  web->>auth: POST /api/auth/login
  auth->>db: сотрудник по логину, проверка пароля (scrypt)
  auth->>db: refresh_tokens: sha256 нового refresh-токена
  auth-->>web: cookie hb_access (путь /) и hb_refresh (путь /api/auth)

  Note over web,auth: прошло больше 15 минут
  web->>auth: GET /api/... с истёкшим hb_access
  auth-->>web: 401 TOKEN_EXPIRED
  web->>auth: POST /api/auth/refresh — один на все запросы, получившие 401
  auth->>db: найти токен по хэшу
  alt токен жив или отозван меньше 30 с назад
    auth->>db: отозвать старый, записать новый
    auth-->>web: новые cookie
    web->>auth: повтор исходного запроса
    auth-->>web: 200
  else REFRESH_INVALID
    auth-->>web: 401
    web-->>user: переход на /login?next=...
  end
```

- **Запас 30 с после ротации** — две вкладки или повтор при плохой связи не выкидывают пользователя.
- **Refresh-cookie уходит только на `/api/auth`**, остальные запросы его не несут.

## Уведомление до браузера

Любой модуль публикует `notification.requested` с `userId` или `broadcast: true` — дальше ядро доставляет его само.

```mermaid
sequenceDiagram
  participant gm as gamification
  participant redis as Redis (events)
  participant cons as EventsConsumer
  participant nt as notifications
  participant users as auth · UsersService
  participant db as Postgres
  participant sse as SSE /api/stream
  participant web as web

  gm->>redis: notification.requested (userId или broadcast)
  redis->>cons: XREADGROUP, группа core
  cons->>sse: адресованное событие — сразу в поток
  sse-->>web: тост
  cons->>nt: обработчик notification.requested
  opt broadcast
    nt->>users: все сотрудники
  end
  nt->>db: строка каждому получателю, дубли (eventId, userId) пропускаются
  nt->>redis: notifications.updated
  redis->>cons: XREADGROUP
  cons->>sse: notifications.updated
  sse-->>web: колокольчик: GET /api/notifications — список и непрочитанные

  web->>nt: POST /api/notifications/read
  nt->>db: readAt всем непрочитанным
  nt->>redis: notifications.updated — другие вкладки обновят счётчик
```

- **Тост приходит раньше записи в базу:** браузеру не нужно ждать Postgres. Список перечитывается по `notifications.updated`, когда строка уже записана.
- **SSE отдаёт пользователю** только события с его `userId` и `broadcast`, раз в 25 с — `ping`.

## Повтор событий и DLQ

Ядро читает стрим `events` группой `core`. Событие подтверждается (`XACK`) только после успешной обработки.

```mermaid
sequenceDiagram
  participant pub as модуль-издатель
  participant redis as Redis
  participant cons as EventsConsumer (группа core)
  participant h as обработчик модуля

  pub->>redis: XADD events
  redis->>cons: XREADGROUP
  alt запись не читается
    cons->>redis: XADD events:dlq с причиной, XACK
  else
    cons->>h: handle(event)
    alt обработано
      cons->>redis: XACK
    else исключение
      Note over cons,redis: без XACK событие остаётся в pending
    end
  end

  loop раз в EVENTS_RETRY_MS (30 с)
    cons->>redis: XPENDING — зависшие дольше 30 с
    cons->>redis: XCLAIM — забрать себе
    alt попыток меньше 5
      cons->>h: handle(event) ещё раз
      cons->>redis: XACK, если обработано
    else 5 попыток
      cons->>redis: XADD events:dlq с последней ошибкой, XACK
    end
  end
```

- **Обработчики идемпотентны:** одно событие может прийти дважды. Геймификация отсекает повтор по `runId`, уведомления — по паре `eventId` и `userId`.
- **Если Redis недоступен,** цикл ждёт 2 с и пересоздаёт группу. Разбор DLQ — `XRANGE events:dlq - +` ([события](events.md)).

## Как обновить картинки

Источник картинок — Mermaid в корневом README (схема компонентов и путь прохождения) и в этом файле. SVG для слайдов пересобираются из корня репозитория (нужен Node, при первом запуске npx скачает Chromium):

```bash
npx -y @mermaid-js/mermaid-cli@12 -i README.md -o docs/diagrams/architecture.md -b white
```

```bash
npx -y @mermaid-js/mermaid-cli@12 -i docs/sequences.md -o docs/diagrams/sequences.md -b white
```

Рядом появятся `architecture-1.svg`, `architecture-2.svg`, `sequences-1.svg`…; сгенерированные `.md` в `docs/diagrams/` удалить.
