import { xpOf } from './progress.js';
import type { Rules } from './rules.js';

export const RATING_SCOPES = ['crew', 'depot', 'company'] as const;
export type RatingScope = (typeof RATING_SCOPES)[number];

// Москва живёт в UTC+3 без перехода на летнее время, поэтому хватает постоянного сдвига
const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

// Начало текущего месяца по Москве: рейтинг каждый месяц начинается заново
export function monthStart(now: Date): Date {
  const moscow = new Date(now.getTime() + MOSCOW_OFFSET_MS);
  return new Date(Date.UTC(moscow.getUTCFullYear(), moscow.getUTCMonth(), 1) - MOSCOW_OFFSET_MS);
}

// «2026-09» — месяц рейтинга; название месяца фронт пишет сам
export function monthOf(now: Date): string {
  return new Date(now.getTime() + MOSCOW_OFFSET_MS).toISOString().slice(0, 7);
}

export interface RatingMember {
  id: string;
  name: string;
}

export interface RatingRun {
  userId: string;
  outcome: string;
  finishedAt: Date;
}

export interface Standing {
  place: number;
  userId: string;
  name: string;
  xp: number;
}

// Места за период: больше опыта — выше. При равном опыте выше тот, кто набрал его раньше,
// то есть чьё последнее прохождение было раньше, — так места всегда разные.
// Кто не проходил сценарии за период, в таблицу не попадает
export function standings(members: RatingMember[], runs: RatingRun[], rules: Rules): Standing[] {
  const totals = new Map<string, { xp: number; reachedAt: number }>();
  for (const run of runs) {
    const total = totals.get(run.userId) ?? { xp: 0, reachedAt: 0 };
    total.xp += xpOf(run, rules);
    total.reachedAt = Math.max(total.reachedAt, run.finishedAt.getTime());
    totals.set(run.userId, total);
  }
  return members
    .flatMap((member) => {
      const total = totals.get(member.id);
      return total ? [{ userId: member.id, name: member.name, ...total }] : [];
    })
    .sort((a, b) => b.xp - a.xp || a.reachedAt - b.reachedAt)
    .map(({ userId, name, xp }, index) => ({ place: index + 1, userId, name, xp }));
}

// Сколько опыта до соседа выше. 0 — опыта столько же, но он набрал раньше: обгонит следующее прохождение
export function gapAbove(rows: Standing[], place: number): { place: number; xp: number } | null {
  const above = rows[place - 2];
  return above ? { place: above.place, xp: above.xp - rows[place - 1].xp } : null;
}
