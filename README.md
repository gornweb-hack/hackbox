# hackbox

Polyglot hackathon starter: Nest.js core with pluggable Go and Python modules, Next.js frontend, PostgreSQL and Redis Streams.

Шаблон команды [Gornweb](https://github.com/gornweb-hack) для хакатонов: ядро на Nest.js и подключаемые модули на Go и Python. Падение модуля не ломает приложение.

> Статус: в разработке.

## Быстрый старт

```bash
docker compose up -d
```

Файл `.env` не нужен. Если порт 5432 занят другим проектом, скопируйте `.env.example` в `.env` и поменяйте `POSTGRES_PORT`.

В `docker compose ps -a` сервис `db-init` показывает `Exited (0)`. Так и должно быть: он создаёт роли и схемы и завершается. Если он упал, смотрите `docker compose logs db-init`. Флаг `--wait` не используйте: Compose считает завершение `db-init` ошибкой.

## База данных

Один Postgres, у каждого сервиса своя схема и своя роль. Роль модуля видит только свою схему, чужие данные берутся через API или события.

| Сервис | Схема | Роль | Пароль |
|---|---|---|---|
| ядро | `public`, ядро — владелец базы | `core_svc` | `core_pass` |
| модуль `<name>` | `<name>` | `<name>_svc` | `module_pass` |

Строка подключения: `postgres://<роль>:<пароль>@localhost:5432/app`. Из контейнеров вместо `localhost` — `postgres`.

### Как добавить модуль

1. Допишите имя в `DB_MODULES` в [docker-compose.yml](docker-compose.yml). Имя: `^[a-z][a-z0-9_]*$`, нельзя `core`, `public`, `pg`, `pg_*`.
2. Выполните `docker compose up -d`. `db-init` создаст схему и роль, данные остальных сервисов не трогаются.

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

## Лицензия

MIT, см. [LICENSE](LICENSE).
