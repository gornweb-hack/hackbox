# web — интерфейс «Рейс 400»

Next.js 16, React 19, Tailwind 4, shadcn/ui на Base UI, TanStack Query. Браузер ходит только сюда: `/api/*` Next проксирует в ядро (`next.config.ts`, адрес — `CORE_URL`, по умолчанию `http://127.0.0.1:4000`).

## Запуск без Docker

Ядро, Postgres и Redis должны работать (`docker compose up -d core` в корне).

```bash
npm install
```
```bash
npm run dev
```

Интерфейс — [http://localhost:3000](http://localhost:3000). Проверки: `npm test`, `npm run lint`, `npm run build`.

## Где что лежит

| Путь | Что там |
|---|---|
| `src/app/login` | вход |
| `src/app/(app)/page.tsx` | главная — табло прогресса |
| `src/app/(app)/scenarios` | каталог, вступление, прохождение и разбор (`runs/[runId]`) |
| `src/app/(app)/rating`, `profile` | рейтинг и профиль: навыки, полка ачивок, история |
| `src/app/(app)/admin` | состояние системы, демо-история, сотрудники |
| `src/components/home` | карточки главной |
| `src/components/run` | плеер прохождения, сцена вагона, разбор, награда |
| `src/lib` | запросы к API по модулям ядра, события SSE (`events.tsx`), расчёты для отрисовки |
| `src/proxy.ts` | без сессии — на `/login` (в Next 16 это бывший `middleware`) |

Правила для ИИ-агентов по Next 16 — в [AGENTS.md](AGENTS.md).
