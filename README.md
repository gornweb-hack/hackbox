# hackbox

Hackathon starter: Next.js frontend, Nest.js backend, PostgreSQL and Redis Streams.

Заготовка команды [Gornweb](https://github.com/gornweb-hack) для хакатонов: фронт на Next.js и бэкенд на Nest.js — одно приложение из модулей. Данные — в PostgreSQL, события и уведомления — через Redis Streams.

> Статус: в разработке.

## Быстрый старт

```bash
docker compose up -d --build
```

Ядро отвечает на `http://127.0.0.1:4000/api/health`.

Файл `.env` не нужен. Если порт 5432, 4000 или 6379 занят другим проектом, скопируйте `.env.example` в `.env` и поменяйте `POSTGRES_PORT`, `CORE_PORT` или `REDIS_PORT`.

В `docker compose ps -a` сервис `db-init` показывает `Exited (0)`. Так и должно быть: он настраивает роль ядра и завершается. Если он упал, смотрите `docker compose logs db-init`. Флаг `--wait` не используйте: Compose считает завершение `db-init` ошибкой.

## Ядро

Ядро на Nest.js ([core/](core/README.md)) — весь бэкенд и единственная точка входа для фронта. Оно собрано из модулей Nest: вход и сотрудники, события, проверка здоровья. Предметные модули подключаются так же, см. [онбординг](docs/onboarding.md).

| Эндпоинт | Что делает |
|---|---|
| `GET /api/health` | `200 {"status":"ok","db":"up","redis":"up"}`, если ядро видит базу, иначе `503 DB_UNAVAILABLE`. Лежащий Redis даёт `"redis":"down"`, но ответ остаётся 200: без Redis ядро работает, только события не ходят |

Если база лежит, эндпоинты, которым она нужна, отвечают `503 DB_UNAVAILABLE`.

Все ошибки API приходят в одном формате `{"code": "NOT_FOUND", "message": "…"}`, ошибка валидации — `422 VALIDATION_ERROR`.

## Вход

Вход по логину: табельный номер, телефон или email, без учёта регистра. Роли: `USER`, `MANAGER`, `ADMIN`.

| Демо-аккаунт | Пароль | Роль |
|---|---|---|
| `admin` | `admin123` | `ADMIN` |
| `manager` | `manager123` | `MANAGER` |
| `user` | `user123` | `USER` |

| Эндпоинт | Кто | Что делает |
|---|---|---|
| `POST /api/auth/login` `{login, password}` | все | `{user, accessToken, refreshToken}` и cookie |
| `POST /api/auth/refresh` | все | новая пара токенов по cookie или `{refreshToken}` |
| `POST /api/auth/logout` | все | отзывает refresh-токен, стирает cookie |
| `GET /api/auth/me` | вошедший | профиль |
| `POST /api/auth/register` `{login, password, name, email?}` | все, если `REGISTRATION_OPEN=true` | регистрация с ролью `USER` |
| `GET /api/users?ids=a,b` | вошедший | публичные `{id, name, role}`, например для рейтинга |
| `POST /api/users`, `PATCH /api/users/:id` | `ADMIN` | завести сотрудника, изменить имя, email, роль или пароль |

Токены:
- access-токен (JWT) живёт `ACCESS_TTL`, по умолчанию 15 минут, и проверяется без базы;
- refresh-токен живёт 30 дней. При обновлении выдаётся новый, старый ещё 30 секунд принимается, чтобы две вкладки не выкидывали пользователя;
- браузеру хватает cookie `hb_access` и `hb_refresh` (httpOnly), остальные клиенты передают `Authorization: Bearer <accessToken>`.

Памятка фронту:
- `401 TOKEN_EXPIRED` → вызвать `POST /api/auth/refresh` и повторить запрос;
- `401 REFRESH_INVALID` или `TOKEN_INVALID` → отправить на страницу входа;
- `EventSource` (`/api/stream`) оборвался → вызвать refresh и переподключиться: статус ответа `EventSource` не показывает.

На демо `ACCESS_TTL` можно поднять, например, до `8h`. Настройки входа лежат в `docker-compose.yml` у сервиса `core`.

## События и уведомления

Модули ядра обмениваются событиями через Redis Streams: один стрим `events`, его читает группа `core`. Формат и правила — в [памятке по событиям](docs/events.md).

**Уведомления в браузер** — `GET /api/stream` (SSE, только для вошедших, в браузере по cookie). В поток приходят:
- события, адресованные пользователю (`userId`), и события для всех (`broadcast: true`). В `data` лежит конверт события;
- именованное событие `ping` раз в 25 с, чтобы соединение не рвалось. Обработчик `onmessage` его не получает.

Чтобы показать сотруднику уведомление, любой модуль ядра публикует `notification.requested` с его `userId`.

**Если Redis лежит,** вход и сотрудники работают, события просто не отправляются (предупреждение в логе ядра). Когда Redis возвращается, ядро переподключается само.

**Отладка:**
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
По порядку: последние события; группы и их отставание (`lag`); неподтверждённые события группы; события, которые не удалось обработать за 5 попыток.

## База данных

Один Postgres, одна база `app`. Бэкенд работает в схеме `public` под ролью `core_svc` (пароль `core_pass`), она же владелец базы. У каждого модуля ядра свои таблицы.

Строка подключения: `postgres://core_svc:core_pass@localhost:5432/app`. Из контейнеров вместо `localhost` — `postgres`.

Правила для таблиц модулей, миграции и отладка — в [памятке по базе данных](docs/database.md).

### Снимок базы перед демо

```bash
# сохранить
docker compose exec postgres pg_dump -U postgres -d app -Fc -f demo.dump
docker compose cp postgres:demo.dump demo.dump

# восстановить (сначала остановите сервисы приложения)
docker compose cp demo.dump postgres:demo.dump
docker compose exec postgres pg_restore -U postgres -d app --clean --if-exists demo.dump
```

Путь внутри контейнера относительный намеренно: Git Bash на Windows портит пути вида `/tmp/...`. Не сохраняйте дамп через `>` в PowerShell: он портит бинарный файл.

### Полный сброс

`docker compose down -v` удаляет все данные. Он нужен, только если поменялись параметры создания базы, например `POSTGRES_INITDB_ARGS`.

## Новый модуль

Предметная часть — модули ядра в `core/src/<name>/`, каждый подключается строкой в `core/src/app.module.ts`. Как написать модуль, работать с базой и событиями — в [онбординге](docs/onboarding.md).

## Лицензия

MIT, см. [LICENSE](LICENSE).
