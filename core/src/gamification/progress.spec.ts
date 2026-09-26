import { describe, expect, it } from 'vitest';
import { levelFor, reputation, xpOf } from './progress.js';
import type { Rules } from './rules.js';

const rules: Rules = {
  levels: [
    { speed: 60, title: 'Стажёр', xp: 0 },
    { speed: 120, title: 'Проводник', xp: 300 },
    { speed: 200, title: 'Старший проводник', xp: 800 },
    { speed: 250, title: 'Наставник смены', xp: 1500 },
  ],
  xp: { good: 150, ok: 100, bad: 50 },
  reputation: { window: 2 },
};

describe('опыт и уровень', () => {
  it('опыт за прохождение — по исходу', () => {
    expect([xpOf({ outcome: 'good' }, rules), xpOf({ outcome: 'bad' }, rules)]).toEqual([150, 50]);
  });

  it('новичок — первый уровень, путь к следующему только начат', () => {
    expect(levelFor(0, rules.levels)).toMatchObject({ level: { speed: 60 }, next: { speed: 120 }, progress: 0 });
  });

  it('пример из макета: 1 360 опыта — «Старший проводник», 80 % пути до 250 км/ч', () => {
    const state = levelFor(1360, rules.levels);
    expect(state.level.title).toBe('Старший проводник');
    expect(state.next?.speed).toBe(250);
    expect(state.progress).toBeCloseTo(0.8);
  });

  it('ровно на пороге — уже новый уровень', () => {
    expect(levelFor(300, rules.levels).level.title).toBe('Проводник');
  });

  it('последний уровень: следующего нет, полоса заполнена', () => {
    expect(levelFor(9000, rules.levels)).toMatchObject({ level: { speed: 250 }, next: null, progress: 1 });
  });
});

describe('репутация', () => {
  const now = new Date('2026-09-26T12:00:00Z');
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);
  const run = (days: number, loyalty: number, safety: number) => ({ outcome: 'good', loyalty, safety, finishedAt: daysAgo(days) });

  it('без прохождений репутации нет', () => {
    expect(reputation([], 10, now)).toBeNull();
  });

  it('среднее — по последним window прохождениям', () => {
    const result = reputation([run(20, 10, 10), run(2, 60, 40), run(1, 80, 60)], 2, now);
    expect(result).toMatchObject({ loyalty: { value: 70 }, safety: { value: 50 }, runs: 2 });
  });

  it('изменение за неделю — разница со средним на момент неделю назад', () => {
    const result = reputation([run(20, 60, 70), run(10, 60, 70), run(1, 80, 50)], 2, now);
    // сейчас: среднее (80, 60) = 70 и (50, 70) = 60; неделю назад: 60 и 70
    expect(result?.loyalty).toEqual({ value: 70, weekDelta: 10 });
    expect(result?.safety).toEqual({ value: 60, weekDelta: -10 });
  });

  it('неделю назад прохождений не было — изменения нет', () => {
    expect(reputation([run(1, 80, 60)], 10, now)?.loyalty.weekDelta).toBeNull();
  });
});
