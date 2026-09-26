# hackbox

Polyglot hackathon starter: Nest.js core with pluggable Go and Python modules, Next.js frontend, PostgreSQL and Redis Streams.

Шаблон команды [Gornweb](https://github.com/gornweb-hack) для хакатонов: ядро на Nest.js и подключаемые модули на Go и Python. Падение модуля не ломает приложение.

> Статус: в разработке.

## Быстрый старт

```bash
docker compose up -d --build
```

Ядро отвечает на `http://127.0.0.1:4000/api/health`.

Файл `.env` не нужен. Если порт 5432, 4000 или 6379 занят другим проектом, скопируйте `.env.example` в `.env` и поменяйте `POSTGRES_PORT`, `CORE_PORT` или `REDIS_PORT`.

В `docker compose ps -a` сервис `db-init` показывает `Exited (0)`. Так и должно быть: он создаёт роли и схемы и завершается. Если он упал, смотрите `docker compose logs db-init`. Флаг `--wait` не используйте: Compose считает завершение `db-init` ошибкой.

## Ядро

Ядро на Nest.js ([core/](core/README.md)) — единственная точка входа для фронта. От модулей оно не зависит: если модуль лежит, ядро работает дальше и сразу отвечает понятной ошибкой.

| Эндпоинт | Что делает |
|---|---|
| `GET /api/health` | `200 {"status":"ok","db":"up","redis":"up"}`, если ядро видит базу, иначе `503 DB_UNAVAILABLE`. Лежащий Redis даёт `"redis":"down"`, но ответ остаётся 200: без Redis ядро работает, только события не ходят |
| `GET /api/modules` | статусы модулей: `[{"name":"tpl_go","status":"up","checkedAt":"…"}]`, опрос `/health` каждые 5 с |
| `ALL /api/m/<name>/<путь>` | прокси в модуль на `/<путь>` |

Ошибки прокси: `404 MODULE_NOT_FOUND` — модуля нет в списке, `503 MODULE_UNAVAILABLE` — модуль лежит (ответ сразу, без ожидания), `504 MODULE_TIMEOUT` — модуль не ответил за 10 с.

Если база лежит, эндпоинты, которым она нужна, отвечают `503 DB_UNAVAILABLE`. Прокси в модули при этом продолжает работать.

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

Модули получают пользователя в заголовках `X-User-Id` и `X-User-Role`, см. [контракт](docs/module-contract.md).

## События и уведомления

Модули обмениваются событиями через Redis Streams: один стрим `events`, у каждого модуля своя группа чтения. Формат и правила — в [контракте](docs/module-contract.md#события-если-модулю-они-нужны).

**Уведомления в браузер** — `GET /api/stream` (SSE, только для вошедших, в браузере по cookie). В поток приходят:
- события, адресованные пользователю (`userId`), и события для всех (`broadcast: true`). В `data` лежит конверт события;
- `{"type":"module.status","data":{"name":"points","status":"down"}}`, когда модуль падает или поднимается, — фронт сразу скрывает или показывает блок;
- именованное событие `ping` раз в 25 с, чтобы соединение не рвалось. Обработчик `onmessage` его не получает.

Чтобы показать сотруднику уведомление, любой модуль публикует `notification.requested` с его `userId`.

**Если Redis лежит,** вход, пользователи и прокси работают, события просто не отправляются (предупреждение в логе ядра). Когда Redis возвращается, ядро переподключается само.

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

Один Postgres, у каждого сервиса своя схема и своя роль. Роль модуля видит только свою схему, чужие данные берутся через API или события.

| Сервис | Схема | Роль | Пароль |
|---|---|---|---|
| ядро | `public`, ядро — владелец базы | `core_svc` | `core_pass` |
| модуль `<name>` | `<name>` | `<name>_svc` | `module_pass` |

Строка подключения: `postgres://<роль>:<пароль>@localhost:5432/app`. Из контейнеров вместо `localhost` — `postgres`.

Как работать с базой без связей между схемами, миграции и отладка — в [памятке по базе данных](docs/database.md).

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

## Модули

Что обязан уметь каждый модуль, описано в [контракте модуля](docs/module-contract.md).

Как подключить модуль:

1. Допишите имя в `x-modules` в начале [docker-compose.yml](docker-compose.yml): этот список читают и база, и ядро. Имя: `^[a-z][a-z0-9_]*$`, нельзя `core`, `public`, `pg`, `pg_*`.
2. Создайте папку `modules/<name>/` с `Dockerfile` по контракту.
3. В `docker-compose.yml` раскомментируйте пример блока модуля в конце `services:`, подставьте имя и порт для отладки из таблицы в контракте.
4. Выполните `docker compose up -d --build`. `db-init` создаст схему и роль, данные остальных сервисов не трогаются. Модуль стартует после `db-init`.
5. Откройте `http://127.0.0.1:81NN/health`, должен вернуться `200`. Через 5 секунд модуль появится в `http://127.0.0.1:4000/api/modules` со статусом `up` и станет доступен через ядро: `http://127.0.0.1:4000/api/m/<name>/...`.

## Лицензия

MIT, см. [LICENSE](LICENSE).
