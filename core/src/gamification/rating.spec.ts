import { describe, expect, it } from 'vitest';
import { gapAbove, monthOf, monthStart, type RatingRun, standings } from './rating.js';
import type { Rules } from './rules.js';

const rules: Rules = {
  levels: [{ speed: 60, title: 'Стажёр', xp: 0 }],
  xp: { good: 150, ok: 100, bad: 50 },
  reputation: { window: 10 },
  achievements: [],
};

const members = [
  { id: 'anna', name: 'Анна' },
  { id: 'boris', name: 'Борис' },
  { id: 'vera', name: 'Вера' },
];

const run = (userId: string, outcome: string, day: number): RatingRun => ({
  userId,
  outcome,
  finishedAt: new Date(Date.UTC(2026, 8, day)),
});

describe('monthStart и monthOf — месяц по Москве', () => {
  it('1 сентября 01:00 по Москве — уже сентябрь', () => {
    const now = new Date('2026-08-31T22:00:00Z');
    expect(monthStart(now).toISOString()).toBe('2026-08-31T21:00:00.000Z');
    expect(monthOf(now)).toBe('2026-09');
  });

  it('31 августа 23:00 по Москве — ещё август', () => {
    const now = new Date('2026-08-31T20:00:00Z');
    expect(monthStart(now).toISOString()).toBe('2026-07-31T21:00:00.000Z');
    expect(monthOf(now)).toBe('2026-08');
  });
});

describe('standings — места за период', () => {
  it('больше опыта — выше; опыт считается по правилам исходов', () => {
    const rows = standings(members, [run('anna', 'bad', 1), run('boris', 'good', 2), run('anna', 'good', 3)], rules);
    expect(rows).toEqual([
      { place: 1, userId: 'anna', name: 'Анна', xp: 200 },
      { place: 2, userId: 'boris', name: 'Борис', xp: 150 },
    ]);
  });

  it('при равном опыте выше тот, кто набрал его раньше', () => {
    const rows = standings(members, [run('anna', 'good', 5), run('boris', 'good', 2)], rules);
    expect(rows.map((row) => row.userId)).toEqual(['boris', 'anna']);
  });

  it('без прохождений за период в таблицу не попадают', () => {
    expect(standings(members, [run('vera', 'ok', 1)], rules).map((row) => row.userId)).toEqual(['vera']);
  });

  it('прохождения не из списка участников не учитываются', () => {
    expect(standings(members, [run('stranger', 'good', 1)], rules)).toEqual([]);
  });
});

describe('gapAbove — сколько опыта до соседа выше', () => {
  const rows = standings(members, [run('anna', 'good', 1), run('boris', 'bad', 2), run('vera', 'bad', 3)], rules);

  it('разница с местом выше', () => {
    expect(gapAbove(rows, 2)).toEqual({ place: 1, xp: 100 });
  });

  it('равный опыт — разрыв 0', () => {
    expect(gapAbove(rows, 3)).toEqual({ place: 2, xp: 0 });
  });

  it('у первого места разрыва нет', () => {
    expect(gapAbove(rows, 1)).toBeNull();
  });
});
