# Рейс 400 — тренажёр проводника ВСМ-400

Геймифицированный тренажёр для проводников высокоскоростной магистрали. Кейс «Геймификация для ВСМ», Хакатон Московского транспорта, команда [Gornweb](https://github.com/gornweb-hack).

Проводник проходит нештатные ситуации из памятки «Ситуации на борту»: пассажиру плохо на 400 км/ч, два билета на одно место, минутная стоянка. Решения на время меняют две шкалы — лояльность пассажира и рейтинг безопасности. Путь по сценарию нелинейный: шкалы копятся и через условия меняют развилки. После финала — разбор каждого решения, опыт и ачивки, место в рейтинге бригады, радар навыков ролевой модели и рекомендация, что потренировать дальше.

Все данные синтетические (152-ФЗ): демо-сотрудники и штат из 35 вымышленных проводников.

## Демо для жюри

| Что | Где |
|---|---|
| Тренажёр | [gornweb.online](https://gornweb.online) — проводник `user` / `user123`, администратор `admin` / `admin123` |
| Схемы архитектуры (PDF): компоненты и путь одного прохождения | [gornweb.online/architecture.pdf](https://gornweb.online/architecture.pdf) |
| Описание схем | [«Архитектура»](#архитектура) ниже в этом README, [диаграммы последовательности](docs/sequences.md) — вход, уведомления, повтор событий |
| API (Swagger) | [gornweb.online/api/docs](https://gornweb.online/api/docs) |

Остальные материалы сдачи — User Flow, ограничения и план развития — в разделе [«Документы»](#документы). Запустить у себя — [«Быстрый старт»](#быстрый-старт).

## Быстрый старт

Нужны только **Git** и **Docker Desktop** (или Docker Engine с Compose v2). Node.js и `npm install` для запуска не нужны: зависимости ставятся внутри образов при сборке. Node понадобится только для [разработки](#разработка).

### Все команды по порядку

Коротко, от скачивания до режима разработки. Подробности — в шагах ниже.

```bash
# 1. Скачать проект
git clone https://github.com/gornweb-hack/hackbox.git
cd hackbox

# 2. Порты: если 3000, 4000, 5432 или 6379 заняты — создать .env
#    с нужной строкой, например WEB_PORT=3100 (см. шаг 2)

# 3. Собрать и запустить всё в Docker, проверить статусы
docker compose up -d --build
docker compose ps -a

# 4. Открыть http://localhost:3000 и войти. Демо-аккаунты (логин / пароль):
#    проводник      user    / user123
#    руководитель   manager / manager123
#    администратор  admin   / admin123
#    Данные для рейтинга: войти admin → «Администрирование» →
#    «Демо-история» → «Сгенерировать»

# 5. Режим разработки фронта (нужен Node.js 24.15+):
#    web переезжает из Docker на хост с перезагрузкой при сохранении
npm --prefix web install
npm run dev

# 6. После правок ядра — пересобрать его
docker compose up -d --build core

# 7. Вернуться к полному Docker (сначала остановить npm run dev: Ctrl+C)
docker compose up -d --build

# 8. Остановить всё, данные сохранятся
docker compose stop
```

### 1. Скачать проект

```bash
git clone https://github.com/gornweb-hack/hackbox.git
```

```bash
cd hackbox
```

### 2. Проверить порты

Приложение открывает на `127.0.0.1` четыре порта:

| Сервис | Порт по умолчанию | Переменная в `.env` |
|---|---|---|
| Тренажёр (web) | 3000 | `WEB_PORT` |
| Ядро (core) | 4000 | `CORE_PORT` |
| Postgres | 5432 | `POSTGRES_PORT` |
| Redis | 6379 | `REDIS_PORT` |

**Если порты свободны, `.env` не нужен** — значения по умолчанию заданы в `docker-compose.yml`, переходите к шагу 3.

**Если порт занят другим проектом** (при запуске Compose пишет `port is already allocated` или `address already in use`):
1. В корне проекта, рядом с `docker-compose.yml`, создайте текстовый файл с именем `.env`. Проверьте, что редактор не дописал расширение: нужно ровно `.env`, а не `.env.txt`.
2. Впишите в него только порт, который нужно поменять, например `WEB_PORT=3100`. Остальные порты останутся по умолчанию. Все переменные с пояснениями — в файле `.env.example`.
3. Переходите к шагу 3 (или повторите его, если запуск уже упал на занятом порту). С `WEB_PORT=3100` тренажёр откроется на [http://localhost:3100](http://localhost:3100). Сервисы внутри Docker общаются по своим именам, поэтому смена портов на `localhost` ничего не ломает. Ссылки ниже даны для портов по умолчанию. Кто занял порт: `netstat -ano | findstr :3000` в Windows, `lsof -i :3000` в macOS и Linux.

### 3. Собрать и запустить

```bash
docker compose up -d --build
```

Первая сборка идёт несколько минут и нужен интернет: скачиваются образы и npm-пакеты. Проверить, что всё поднялось:

```bash
docker compose ps -a
```

`postgres`, `redis`, `core` и `web` — `running`, у `db-init` — `Exited (0)`. Так и должно быть: он настраивает роль ядра в базе и завершается. Если какой-то сервис упал — `docker compose logs <сервис>`. Флаг `--wait` не используйте: Compose считает завершение `db-init` ошибкой.

### 4. Открыть

| Что | Где |
|---|---|
| Тренажёр | [http://localhost:3000](http://localhost:3000) |
| Swagger | [http://127.0.0.1:3000/api/docs](http://127.0.0.1:3000/api/docs), схема OpenAPI — `/api/docs-json` |
| Схемы архитектуры одним PDF, без входа | [http://127.0.0.1:3000/architecture.pdf](http://127.0.0.1:3000/architecture.pdf) (файл — `web/public/architecture.pdf`) |
| Проверка ядра | [http://127.0.0.1:4000/api/health](http://127.0.0.1:4000/api/health) |

| Демо-аккаунт | Пароль | Роль |
|---|---|---|
| `user` | `user123` | `USER` — проводник, «Бригада 3», «Депо Москва-ВСМ» |
| `manager` | `manager123` | `MANAGER` |
| `admin` | `admin123` | `ADMIN` |

Чтобы у рейтинга и репутации были данные, войдите `admin` и в «Администрирование → Состояние системы» нажмите «Сгенерировать» в карточке «Демо-история». Появятся прохождения за три недели у 35 синтетических проводников (`staff-01…35`, шесть бригад в двух депо). `user` остаётся без прохождений: под ним показывают рост с 1-го уровня. Повтор безопасен: у кого прохождения уже есть, тех ядро пропускает.

**Сессия живёт 15 минут.** Для длинного показа поднимите `ACCESS_TTL` до `8h` в `docker-compose.yml` у сервиса `core` и перезапустите его: `docker compose up -d core`.

Остановить — `docker compose stop`, данные сохранятся. `docker compose down -v` удаляет и базу.

## Что реализовано по ТЗ

| Требование | Как сделано | Где в коде |
|---|---|---|
| Нелинейные сценарии с ветвлением и условиями | граф узлов в YAML, переходы по условиям на шкалы | `content/scenarios/`, `core/src/scenarios/engine.ts` |
| Таймеры на критические решения | таймер считает сервер, таймаут ведёт по своей ветке | `engine.ts` (`resolveAction`) |
| Шкалы «лояльность пассажира» и «рейтинг безопасности» | эффекты каждого решения, обрезка 0–100, репутация — среднее за 10 прохождений с трендом за неделю | `engine.ts`, `core/src/gamification/progress.ts` |
| Опыт и уровни | опыт за исход, уровни — вагоны одного состава, 60 → 400 км/ч | `content/gamification.yaml` |
| Очки компетенций, аналитика пробелов | радар шести навыков ролевой модели, слабый навык, рекомендация сценария | `content/skills.yaml`, `core/src/analytics/` |
| Ачивки | 8 ачивок по правилам в YAML, полка в профиле | `core/src/gamification/achievements.ts` |
| Рейтинг бригады, депо и компании | опыт за месяц, место и разрыв до соседа | `core/src/gamification/rating.ts` |
| Разбор решений | что повлияло на шкалы и как лучше — по каждому решению | поле `review` в сценариях |
| Уведомления | тосты о новом уровне и ачивках через события Redis → SSE, центр уведомлений со счётчиком на колокольчике, плашка нового сценария | `core/src/events/`, `core/src/notifications/` |
| Документированный API для HR и LMS | Swagger на `/api/docs`, [справочник API](docs/api.md), события в Redis Stream | `core/src/common/swagger.ts` |

## Архитектура

Браузер работает только с веб-приложением, весь бэкенд — одно приложение Nest.js из модулей. Контент (сценарии и правила) — YAML-файлы, данные — Postgres, события — Redis Streams.

```mermaid
flowchart LR
  browser["Браузер проводника<br/>телефон или компьютер"]
  web["web · Next.js 16<br/>интерфейс, прокси /api/*"]
  subgraph core["core · Nest.js 12 — одно приложение из модулей"]
    auth["auth<br/>вход, сотрудники, бригады"]
    scenarios["scenarios<br/>каталог и движок сценариев"]
    gamification["gamification<br/>опыт, уровни, ачивки, рейтинг"]
    analytics["analytics<br/>навыки и рекомендация"]
    notifications["notifications<br/>центр уведомлений, прочитано"]
    events["events<br/>Redis → SSE"]
  end
  content[("content/*.yaml<br/>сценарии и правила")]
  postgres[("Postgres 17")]
  redis[("Redis 8<br/>стрим events")]

  browser -->|"HTTP, cookie сессии, SSE"| web
  web -->|"/api/* через rewrites"| core
  scenarios --> content
  gamification --> content
  analytics --> content
  auth --> postgres
  scenarios --> postgres
  gamification --> postgres
  notifications --> postgres
  auth -->|"user.created, user.updated"| redis
  scenarios -->|"scenario.completed"| redis
  gamification -->|"progress.updated, notification.requested"| redis
  notifications -->|"notifications.updated"| redis
  redis -->|"группа core"| gamification
  redis -->|"группа core"| notifications
  redis --> events
  analytics -.->|"сервисы модуля"| scenarios
  gamification -.->|"штат для рейтинга"| auth
  notifications -.->|"получатели broadcast"| auth
```

- **Браузер ходит только на `web`.** Next проксирует `/api/*` в ядро, поэтому cookie и SSE работают с одного адреса.
- **Ядро — единственный бэкенд.** Модули подключаются строкой в `core/src/app.module.ts`.
- **Модули не лезут в чужие таблицы.** Чужие данные — копией из события или через экспортированный сервис модуля.

### Путь одного прохождения

```mermaid
sequenceDiagram
  actor user as Проводник
  participant web as web
  participant sc as scenarios
  participant db as Postgres
  participant redis as Redis (events)
  participant gm as gamification
  participant nt as notifications
  participant sse as events (SSE)

  user->>web: «Начать»
  web->>sc: POST /api/scenarios/runs
  sc->>db: прохождение: первый узел, шкалы 50/50, время показа узла
  sc-->>web: узел, варианты, таймер
  loop каждое решение
    user->>web: вариант (или время вышло)
    web->>sc: POST /api/scenarios/runs/:id/choices
    sc->>sc: движок: эффекты на шкалы (0–100), таймер с запасом 1,5 с, условный переход
    sc->>db: решение и новое состояние — одной транзакцией
    sc-->>web: следующий узел или финал с разбором
  end
  sc->>redis: scenario.completed (исход, шкалы, решения)
  redis->>gm: группа core
  gm->>db: запись в журнал (повтор отсекается по runId)
  gm->>redis: progress.updated, notification.requested («Новый уровень», «Ачивка: …»)
  redis->>sse: события с userId проводника
  sse-->>web: тосты — главная перечитывает прогресс, рейтинг и навыки
  redis->>nt: notification.requested, группа core
  nt->>db: строка в центр уведомлений (повтор отсекается парой eventId + userId)
  nt->>redis: notifications.updated
  redis->>sse: событие с userId проводника
  sse-->>web: колокольчик перечитывает список и счётчик
```

- **Движок сценариев — чистые функции** в `core/src/scenarios/engine.ts`: шкалы, условные переходы и таймер проверяются тестами без базы.
- **Таймер считает сервер** по времени показа узла: выбор после дедлайна засчитывается как «время вышло».
- **Сценарии не знают о геймификации.** Они публикуют `scenario.completed`, а опыт, ачивки и уведомления считают подписчики. Повтор события не удваивает опыт.

Модули ядра, ключевые решения и безопасность — в [архитектуре](docs/architecture.md). Вход, доставка уведомлений и повтор событий — в [диаграммах последовательности](docs/sequences.md).

## Документы

| Документ | О чём |
|---|---|
| [Архитектура](docs/architecture.md) | модули ядра, ключевые решения, безопасность |
| [Диаграммы последовательности](docs/sequences.md) | вход и обновление токена, уведомления, повтор событий и DLQ; SVG для слайдов — в [docs/diagrams/](docs/diagrams/) |
| [User Flow и примеры сценариев](docs/user-flow.md) | путь проводника и администратора, граф сценария, три прохождения с цифрами |
| [API](docs/api.md) | эндпоинты ядра, ошибки, токены; живая версия — Swagger |
| [Ограничения и план развития](docs/limitations.md) | что упрощено в прототипе и как развивать |
| [Контент](docs/content.md) | формат сценариев и правил, рецепты правки на лету |
| [Памятка к защите](docs/pitch.md) | сценарий показа, правки на лету, ответы на вопросы |

Для разработчиков: [онбординг](docs/onboarding.md), [база данных](docs/database.md), [события](docs/events.md), [ядро](core/README.md), [фронт](web/README.md).

## Разработка

```bash
npm run dev
```

Команда из корня останавливает контейнер `web`, поднимает в Docker базу, Redis и ядро и запускает фронт на [http://localhost:3000](http://localhost:3000) с перезагрузкой при сохранении. Нужны Node.js 24.15 или новее и зависимости фронта: один раз `npm --prefix web install`. Правки ядра так не подхватываются — пересоберите его: `docker compose up -d --build core`. Вернуться к полному Docker: `docker compose up -d --build`. Режим разработки рассчитан на порты по умолчанию: фронт всегда открывается на 3000 и ищет ядро на `127.0.0.1:4000` (переменная `CORE_URL`), `WEB_PORT` и `CORE_PORT` из `.env` он не учитывает.

- **Проверки** в `core/` и `web/`: `npm test`, `npm run lint`, `npm run build`.
- **Новый модуль ядра** — папка `core/src/<name>/` и строка в `core/src/app.module.ts`, по шагам — в [онбординге](docs/onboarding.md).
- **Сценарии и правила** правятся в [content/](content/) без пересборки — [памятка по контенту](docs/content.md).
- **База:** подключение `postgres://core_svc:core_pass@localhost:5432/app`, снимок перед демо и сброс — в [памятке по базе](docs/database.md#снимок-базы-перед-демо).

## Лицензия

MIT, см. [LICENSE](LICENSE).
