# Старт для Python-разработчика

Инструкция для Python-разработчика. Модуль — `analytics`, порт для отладки — 8103. Что он делает:
- собирает результаты прохождений;
- строит профиль компетенций проводника: сильные стороны, пробелы, динамику;
- даёт содержательные выводы и рекомендации следующего сценария;
- показывает руководителю картину по команде.

Это закрывает критерий ТЗ «Обратная связь и аналитика компетенций» (4 балла). Жюри там прямо ценит выводы выше сырого лога. Отдельная задача — генератор синтетических данных для демо.

Go-разработчикам — [onboarding-go.md](onboarding-go.md).

## 0. Подготовить машину

- Git, Docker Desktop (запущен, «Engine running»), Python 3.13, менеджер пакетов [uv](https://docs.astral.sh/uv/).
- VS Code с расширениями Python, Ruff и Docker.
- Доступ к репозиторию `gornweb-hack/hackbox`.

## 1. Поднять проект (≈15 минут)

```bash
git clone git@github.com:gornweb-hack/hackbox.git
cd hackbox
docker compose up -d --build
```

- Откройте http://127.0.0.1:3000 и войдите под `user` / `user123`.
- Если порт занят другим проектом, скопируйте `.env.example` в `.env` и поменяйте порт.
- Подробности запуска — в [README](../README.md).

## 2. Прочитать (≈30 минут)

1. [README](../README.md) — как устроен проект: ядро, вход, события, база.
2. [AGENTS.md](../AGENTS.md) — правила работы, особенности версий. Нужны и вам, и ИИ-помощнику.
3. [Контракт модуля](module-contract.md) — **главное**: что обязан уметь ваш сервис.
4. `core/src/events/events.consumer.ts` — работающий образец цикла чтения событий. Python-версия пишется по нему.

## 3. Договориться с командой (первый созвон, ≈1 час)

- **Событие `scenario.completed`.** Его публикует движок сценариев (Go-1), вы его читаете. Нужно, чтобы в нём было всё для аналитики:
  - `userId` проводника в конверте;
  - шкалы «лояльность» и «безопасность», очки по компетенциям, число таймаутов;
  - список решений с эффектами.

  Черновик формата есть в [onboarding-go.md](onboarding-go.md), раздел 3. Итог записать в таблицу событий в контракте.
- **Компетенции.** Единый справочник (`conflict`, `medical`, `standards`, …) и связь «сценарий → компетенции» — чтобы рекомендовать сценарий под пробел.
- **API для фронта.** Что показывать в профиле проводника и в кабинете руководителя.

## 4. Зарегистрировать модуль

Если это ещё не сделал техлид одним коммитом за всех:

1. **Список модулей.** В `docker-compose.yml` в `x-modules` заменить заглушки: `tpl_go,tpl_py` → `scenarios,gamification,analytics`. База сама создаст схему `analytics` и роль `analytics_svc`.
2. **Таблица портов.** В контракте заменить `tpl_go` и `tpl_py` на реальные имена и порты.
3. **Блок сервиса.** Раскомментировать пример в конце `services:` — **только вместе с первым `Dockerfile`**. Если блок есть, а папки ещё нет, `docker compose up` сломается у всех.
   ```yaml
     analytics:
       <<: *module
       build: ./modules/analytics
       environment:
         PORT: "8080"
         DATABASE_URL: postgres://analytics_svc:module_pass@postgres:5432/app
         REDIS_URL: redis://:redis_pass@redis:6379
       ports:
         - "127.0.0.1:8103:8080"
   ```

`docker-compose.yml` и контракт — общие файлы. Перед правкой сделайте `git pull`, а правку сразу закоммитьте и сообщите команде.

## 5. Скелет модуля — сначала контракт, потом логика

**Рекомендуемый стек:**
- FastAPI и uvicorn;
- pydantic v2;
- SQLAlchemy 2 с psycopg 3 и Alembic;
- redis-py (`redis.asyncio`);
- Faker — для синтетических данных.

**Структура** (предложение):
```
modules/analytics/
  app/main.py        FastAPI, lifespan: запуск цикла событий
  app/api.py         роуты, чтение X-User-Id/X-User-Role
  app/errors.py      формат ошибок {code, message}
  app/schemas.py     pydantic-модели ответов (camelCase)
  app/db.py          SQLAlchemy engine и сессии
  app/events.py      публикация и цикл чтения
  app/insights.py    предметная логика: профиль, пробелы, выводы, рекомендации
  migrations/        alembic
  scripts/seed.py    генератор синтетических данных
  pyproject.toml, uv.lock, Dockerfile
```

**Чек-лист контракта** — пройти по порядку:
1. Сервис слушает `$PORT` (в compose — 8080).
2. `GET /health` → `200 {"status":"ok"}`, если `SELECT 1` в базе прошёл, иначе `503`.
3. `GET /openapi.json`. FastAPI отдаёт его сам, документацию — на `/docs`.
4. **База.**
   - Подключение из `DATABASE_URL`. **Ловушка:** SQLAlchemy не принимает схему `postgres://` — замените её в коде на `postgresql+psycopg://`.
   - Миграции Alembic применяются при старте. Таблицы пишутся без префикса схемы: `search_path` у роли уже настроен, и `alembic_version` тоже ляжет в свою схему.
5. **Пользователь.** Если эндпоинту нужен пользователь, а `X-User-Id` нет, — `401`. Кабинет руководителя — только для `MANAGER` и `ADMIN` из `X-User-Role`, иначе `403`.
6. **Ошибки** — `{"code":"NOT_FOUND","message":"…"}`. FastAPI по умолчанию отвечает `{"detail": …}`, поэтому нужны свои обработчики:
   - для `HTTPException`;
   - для `RequestValidationError` → `422` с `code: "VALIDATION_ERROR"`.
7. **Формат данных.**
   - JSON в camelCase: базовая модель с `ConfigDict(alias_generator=to_camel, populate_by_name=True)`, FastAPI отдаёт ответы по алиасам;
   - время — только с часовым поясом UTC;
   - идентификаторы — UUID;
   - списки — `{"items": [...], "total": N}`.
8. **Тяжёлые вычисления** (pandas и т. п.) — через `asyncio.to_thread`, чтобы не блокировать обработку запросов и цикл событий.

**Dockerfile:**
```dockerfile
FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY . .
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8080
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
```

## 6. События в Python

Алгоритм — в разделе «События» [контракта](module-contract.md#события-если-модулю-они-нужны). С `redis.asyncio` (`decode_responses=True`) он ложится так:

| Шаг | Вызов |
|---|---|
| публикация | `await r.xadd("events", {"type": t, "event": json_str}, maxlen=10000, approximate=True)` |
| группа при старте | `await r.xgroup_create("events", "analytics", id="$", mkstream=True)`, `ResponseError` с `BUSYGROUP` игнорировать |
| чтение | `await r.xreadgroup("analytics", consumer, {"events": ">"}, count=10, block=5000)` |
| успех | `await r.xack("events", "analytics", id)` |
| повторы раз в 30 с | `await r.xpending_range("events", "analytics", min="-", max="+", count=10, idle=30000)` возвращает `times_delivered`; затем `await r.xclaim(..., min_idle_time=30000, message_ids=[id])`. Если доставок 5 и больше, отправить в `events:dlq` с полями `error`, `group`, `sourceId` и сделать `xack` |

- **Форма ответа `xreadgroup`.** При протоколе по умолчанию (RESP2) он приходит как `[["events", [(id, {поля})]]]`. Если включить `protocol=3`, придёт словарь — разбор должен это учитывать (см. AGENTS.md про RESP3).
- **Имя consumer** — `socket.gethostname()`. Цикл запускается задачей в `lifespan` FastAPI и останавливается при выключении.
- **Идемпотентность.** Одно событие может прийти дважды: уникальный ключ по `runId` в своей таблице — и повтор просто игнорируется.
- **Уведомления.** Публикация — «лучшее усилие»: если Redis лежит, запрос пользователя не должен падать. Уведомить проводника (например, «у вас просела медицинская компетенция») — событие `notification.requested` с его `userId`.

## 7. Проверить интеграцию

```bash
docker compose up -d --build analytics
```
- `http://127.0.0.1:8103/health` → 200. Это модуль напрямую.
- В админке фронта (или на `http://127.0.0.1:4000/api/modules`) модуль в статусе «работает» не позже чем через 5 секунд.
- `http://127.0.0.1:3000/api/m/analytics/<путь>` → ваш эндпоинт через ядро. В браузере после входа `X-User-Id` приходит сам.
- Своя группа читателей видна так:
  ```bash
  docker compose exec redis redis-cli -a redis_pass --no-auth-warning XINFO GROUPS events
  ```

## 8. Цикл разработки

- **Быстро — нативно, с перезапуском при изменениях.** Если модуль уже есть в compose, остановите контейнер: `docker compose stop analytics`. Запуск в PowerShell:
  ```powershell
  $env:DATABASE_URL="postgres://analytics_svc:module_pass@localhost:5432/app"; $env:REDIS_URL="redis://:redis_pass@localhost:6379"; uv run uvicorn app.main:app --reload --port 8103
  ```
  Порт базы — `POSTGRES_PORT` из вашего `.env`. Запросы шлите прямо на `:8103`, пользователя подставляйте сами: `curl.exe -H "X-User-Id: <uuid>" -H "X-User-Role: MANAGER" ...`.
- **Через ядро с нативным модулем.** Нужен локальный файл `docker-compose.override.yml`, его не коммитить:
  ```yaml
  services:
    core:
      environment:
        MODULE_URL_ANALYTICS: http://host.docker.internal:8103
  ```
  После него выполнить `docker compose up -d core`.
- **Интеграция** — в контейнере: `docker compose up -d --build analytics`. Логи — `docker compose logs -f analytics`.

## 9. Git и самостоятельность

- Свой код — только в `modules/analytics/`.
- `git pull` — несколько раз в день. Коммиты маленькие и осмысленные: `feat(analytics): add competency gaps`. Жюри смотрит историю.
- **Понимайте каждую строку.** ИИ как помощник можно, но на защите спросят, как считается профиль и почему пробел определяется именно так.
- **Данные только синтетические** (152-ФЗ): никаких реальных ФИО, телефонов, табельных номеров.

## 10. Задачи на первый день

1. **Модуль в статусе «работает»** в админке.
2. **Подписка на `scenario.completed`.** Результаты прохождений хранятся в своей таблице, повтор отсекается по `runId`.
3. **`GET /me/competencies` — профиль проводника:**
   - очки по каждой компетенции и сколько сценариев пройдено;
   - средние «лояльность» и «безопасность», доля таймаутов;
   - что освоено, а что проседает.
4. **`GET /me/insights` — выводы текстом,** а не сырые цифры. Например: «Конфликты решаете уверенно; в медицинских ситуациях 2 из 3 решений снизили безопасность — рекомендуем сценарий "Пассажиру плохо"».
5. **Генератор синтетических данных `scripts/seed.py`** (Faker, `ru_RU`):
   - заводит сотрудников через API ядра: вход `admin` → `POST /api/auth/login`, затем `POST /api/users` с Bearer-токеном;
   - публикует в `events` правдоподобные `scenario.completed` с `source: "seed"`.

   Так рейтинг Go-2 и ваша аналитика на демо не будут пустыми. Формат события согласуйте с Go-1.
6. **Позже:** кабинет руководителя (пробелы команды, для `MANAGER`). Разрез по бригаде и депо появится, когда ядро начнёт хранить оргструктуру.
