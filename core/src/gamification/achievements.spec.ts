import { describe, expect, it } from 'vitest';
import { type AchievementRun, achievementsOfRun, earned, progressOf } from './achievements.js';
import type { Achievement } from './rules.js';

const achievement = (id: string, when: Achievement['when']): Achievement => ({ id, title: id, description: '', when });

let day = 0;
const run = (fields: Partial<AchievementRun>): AchievementRun => ({
  runId: `r${++day}`,
  category: 'service',
  outcome: 'ok',
  loyalty: 50,
  safety: 50,
  timeouts: 0,
  timedDecisions: 0,
  finishedAt: new Date(Date.UTC(2026, 8, day)),
  ...fields,
});

describe('earned — какие ачивки получены и на каком прохождении', () => {
  it('«N прохождений» — на N-м по времени', () => {
    const runs = [run({ runId: 'b' }), run({ runId: 'a' })];
    expect(earned(runs, [achievement('first', { runs: 1 })])[0].run.runId).toBe('b');
  });

  it('«N категорий» — когда набралось N разных', () => {
    const runs = [run({ category: 'medical' }), run({ category: 'medical' }), run({ runId: 'third', category: 'conflict' })];
    expect(earned(runs, [achievement('two', { categories: 2 })])[0].run.runId).toBe('third');
  });

  it('условия на одно прохождение — все сразу', () => {
    const rules = [achievement('first-aid', { run: { category: 'medical', outcome: 'good' } })];
    expect(earned([run({ category: 'medical', outcome: 'ok' }), run({ category: 'service', outcome: 'good' })], rules)).toEqual([]);
    expect(earned([run({ category: 'medical', outcome: 'good' })], rules)).toHaveLength(1);
  });

  it('«без таймаутов» — только если решения на время были', () => {
    const rules = [achievement('cold-head', { run: { noTimeouts: true } })];
    expect(earned([run({ timedDecisions: 0 })], rules)).toEqual([]);
    expect(earned([run({ timedDecisions: 2, timeouts: 1 })], rules)).toEqual([]);
    expect(earned([run({ timedDecisions: 2, timeouts: 0 })], rules)).toHaveLength(1);
  });
});

describe('achievementsOfRun — награда за прохождение', () => {
  it('ачивка засчитывается прохождению, на котором впервые выполнилось условие', () => {
    const rules = [achievement('first', { runs: 1 }), achievement('safe', { run: { minSafety: 80 } })];
    const runs = [run({ runId: 'old', safety: 50 }), run({ runId: 'new', safety: 90 })];
    expect(achievementsOfRun('old', runs, rules).map((item) => item.id)).toEqual(['first']);
    expect(achievementsOfRun('new', runs, rules).map((item) => item.id)).toEqual(['safe']);
  });
});

describe('progressOf — плитка «Следующая»', () => {
  it('прохождения и категории — сколько из скольких', () => {
    expect(progressOf(achievement('m', { runs: 10 }), [run({}), run({}), run({})])).toEqual({ share: 0.3, text: '3 из 10 прохождений' });
    expect(progressOf(achievement('f', { runs: 1 }), [])).toEqual({ share: 0, text: '0 из 1 прохождения' });
    expect(progressOf(achievement('c', { categories: 4 }), [run({ category: 'medical' })]).text).toBe('1 из 4 категорий');
  });

  it('без таймаутов — лучшая попытка, как в макете', () => {
    const progress = progressOf(achievement('cold', { run: { noTimeouts: true } }), [
      run({ timedDecisions: 6, timeouts: 3 }),
      run({ timedDecisions: 6, timeouts: 1 }),
    ]);
    expect(progress.text).toBe('Лучшая попытка: 5 из 6 решений вовремя');
    expect(progress.share).toBeCloseTo(5 / 6);
  });

  it('порог шкалы — лучший результат; «категория на отлично» — без полосы', () => {
    expect(progressOf(achievement('s', { run: { minSafety: 80 } }), [run({ safety: 72 })]).text).toBe('Лучший результат: 72 из 80');
    expect(progressOf(achievement('a', { run: { category: 'medical', outcome: 'good' } }), [])).toEqual({ share: null, text: null });
  });
});
