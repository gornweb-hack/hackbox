import type { Level } from "./gamification";
import type { RunSummary } from "./runs";
import type { Scenario } from "./scenarios";

// Маршрут «Рейса 400»: уровни — станции линии, сценарии — остановки на перегонах между ними.
// Остановки идут в порядке каталога (order) и распределяются по перегонам равномерно:
// первые сценарии — ближе к началу маршрута. Опыт даёт позицию поезда на линии

export interface RouteSegment {
  from: Level;
  to: Level;
  stops: Scenario[];
}

export function buildRoute(levels: Level[], scenarios: Scenario[]): RouteSegment[] {
  const segments: RouteSegment[] = levels.slice(1).map((to, index) => ({ from: levels[index], to, stops: [] }));
  if (segments.length === 0) return [];
  scenarios.forEach((scenario, index) => {
    segments[Math.floor((index * segments.length) / scenarios.length)].stops.push(scenario);
  });
  return segments;
}

// Следующая остановка — первый непройденный сценарий по маршруту
export function nextStop(scenarios: Scenario[]): Scenario | undefined {
  return scenarios.find((scenario) => !scenario.completed);
}

// Где поезд: индекс перегона и доля пути по нему 0–1. На последней станции — конец последнего перегона
export function trainPosition(levels: Level[], xp: number): { segment: number; share: number } {
  const last = levels.length - 2;
  if (last < 0) return { segment: 0, share: 0 };
  for (let index = 0; index <= last; index++) {
    const from = levels[index].xp;
    const to = levels[index + 1].xp;
    if (xp < to) return { segment: index, share: Math.max(0, (xp - from) / (to - from)) };
  }
  return { segment: last, share: 1 };
}

// Лучший результат по каждому сценарию — для штампа на «пробитом билете»:
// сначала исход, при равном — безопасность, потом лояльность
const OUTCOME_RANK = { good: 2, ok: 1, bad: 0 } as const;

export function bestRuns(runs: RunSummary[]): Map<string, RunSummary> {
  const best = new Map<string, RunSummary>();
  for (const run of runs) {
    const current = best.get(run.scenarioId);
    const better =
      !current ||
      OUTCOME_RANK[run.outcome] > OUTCOME_RANK[current.outcome] ||
      (run.outcome === current.outcome && (run.safety > current.safety || (run.safety === current.safety && run.loyalty > current.loyalty)));
    if (better) best.set(run.scenarioId, run);
  }
  return best;
}

// Анонсы на пустых перегонах в конце маршрута: ситуации из памятки «Ситуации на борту»,
// которые готовятся следующими (план развития в docs). Это не сценарии — их нельзя начать
export interface Upcoming {
  title: string;
  category: string;
  // Номер ситуации в памятке
  memo: number;
}

export const UPCOMING: Upcoming[] = [
  { title: "Бесхозная вещь в салоне", category: "Медицина и безопасность", memo: 41 },
  { title: "Нетрезвый пассажир", category: "Конфликты", memo: 6 },
];

// Анонсы занимают пустые перегоны с конца маршрута, по одному на перегон
export function upcomingBySegment(route: RouteSegment[], upcoming: Upcoming[]): Map<number, Upcoming> {
  const result = new Map<number, Upcoming>();
  const empty = route.map((segment, index) => (segment.stops.length === 0 ? index : -1)).filter((index) => index >= 0);
  // Если пустых перегонов меньше, чем анонсов, показываем последние анонсы — самые «дальние»
  const count = Math.min(empty.length, upcoming.length);
  const items = upcoming.slice(upcoming.length - count);
  empty.slice(empty.length - count).forEach((segmentIndex, i) => result.set(segmentIndex, items[i]));
  return result;
}
