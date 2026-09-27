import type { Level, Outcome, Rules } from './rules.js';

// Прохождение из журнала геймификации (копия scenario.completed)
export interface JournalRun {
  outcome: string;
  loyalty: number;
  safety: number;
  finishedAt: Date;
}

// Опыт за одно прохождение — по исходу, из content/gamification.yaml
export function xpOf(run: Pick<JournalRun, 'outcome'>, rules: Rules): number {
  return rules.xp[run.outcome as Outcome] ?? 0;
}

export interface LevelState {
  level: Level;
  next: Level | null;
  // Доля пути от порога текущего уровня к следующему, 0–1; на последнем уровне — 1
  progress: number;
}

// Уровень по накопленному опыту: последний, чей порог уже взят
export function levelFor(xp: number, levels: Level[]): LevelState {
  const index = levels.reduce((found, level, i) => (xp >= level.xp ? i : found), 0);
  const level = levels[index];
  const next = levels[index + 1] ?? null;
  return { level, next, progress: next ? (xp - level.xp) / (next.xp - level.xp) : 1 };
}

export interface ScaleAverage {
  value: number;
  // Изменение за неделю; null — неделю назад прохождений ещё не было
  weekDelta: number | null;
}

export interface Reputation {
  loyalty: ScaleAverage;
  safety: ScaleAverage;
  // По скольким прохождениям посчитано среднее
  runs: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Репутация — среднее итоговых шкал за последние window прохождений.
// Изменение за неделю — разница с тем же средним, посчитанным на момент неделю назад
export function reputation(runs: JournalRun[], window: number, now: Date): Reputation | null {
  const latest = (until: number) =>
    runs
      .filter((run) => run.finishedAt.getTime() <= until)
      .sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())
      .slice(0, window);
  const average = (items: JournalRun[], scale: 'loyalty' | 'safety') =>
    Math.round(items.reduce((sum, run) => sum + run[scale], 0) / items.length);

  const current = latest(now.getTime());
  if (current.length === 0) return null;
  const weekAgo = latest(now.getTime() - WEEK_MS);
  const scale = (name: 'loyalty' | 'safety'): ScaleAverage => {
    const value = average(current, name);
    return { value, weekDelta: weekAgo.length ? value - average(weekAgo, name) : null };
  };
  return { loyalty: scale('loyalty'), safety: scale('safety'), runs: current.length };
}
