# Рейс 400 — тренажёр проводника ВСМ-400

Геймифицированный тренажёр для проводников высокоскоростной магистрали. Кейс «Геймификация для ВСМ», Хакатон Московского транспорта, команда [Gornweb](https://github.com/gornweb-hack).

Проводник проходит нештатные ситуации из памятки «Ситуации на борту»: пассажиру плохо на 400 км/ч, два билета на одно место, минутная стоянка. Решения на время меняют две шкалы — лояльность пассажира и рейтинг безопасности. Путь по сценарию нелинейный: шкалы копятся и через условия меняют развилки. После финала — разбор каждого решения, опыт и ачивки, место в рейтинге бригады, радар навыков ролевой модели и рекомендация, что потренировать дальше.

Все данные синтетические (152-ФЗ): демо-сотрудники и штат из 35 вымышленных проводников.

## Быстрый старт

```bash
docker compose up -d --build
```

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

Чтобы у рейтинга и репутации были данные, войдите `admin` и в «Администрирование → Состояние системы» нажмите «Сгенерировать» в карточке «Демо-история». Появятся прохождения за три недели у 35 синтетических проводников (`staff-01…35`, шесть бригад в двух депо) и у `user`. Повтор безопасен: у кого прохождения уже есть, тех ядро пропускает.

- **Файл `.env` не нужен.** Если порт 5432, 4000 или 6379 занят другим проектом, скопируйте `.env.example` в `.env` и поменяйте `POSTGRES_PORT`, `CORE_PORT` или `REDIS_PORT`.
- **`db-init` в `docker compose ps -a` показывает `Exited (0)`** — так и должно быть: он настраивает роль ядра и завершается. Если он упал — `docker compose logs db-init`. Флаг `--wait` не используйте: Compose считает это завершение ошибкой.
- **Сессия живёт 15 минут.** Для длинного показа поднимите `ACCESS_TTL` до `8h` в `docker-compose.yml` у сервиса `core`.

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

Команда из корня останавливает контейнер `web`, поднимает в Docker базу, Redis и ядро и запускает фронт на [http://localhost:3000](http://localhost:3000) с перезагрузкой при сохранении. Нужны зависимости фронта: один раз `npm --prefix web install`. Правки ядра так не подхватываются — пересоберите его: `docker compose up -d --build core`. Вернуться к полному Docker: `docker compose up -d --build`.

- **Проверки** в `core/` и `web/`: `npm test`, `npm run lint`, `npm run build`.
- **Новый модуль ядра** — папка `core/src/<name>/` и строка в `core/src/app.module.ts`, по шагам — в [онбординге](docs/onboarding.md).
- **Сценарии и правила** правятся в [content/](content/) без пересборки — [памятка по контенту](docs/content.md).
- **База:** подключение `postgres://core_svc:core_pass@localhost:5432/app`, снимок перед демо и сброс — в [памятке по базе](docs/database.md#снимок-базы-перед-демо).

## Лицензия

MIT, см. [LICENSE](LICENSE).
