import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { simulateRun } from './demo-history.js';
import { parseScript } from './script.js';

const script = parseScript(
  parse(`
start: ask
nodes:
  ask:
    text: Пассажиру плохо
    timer: 15
    timeout: {effects: {safety: -25}, review: Медлили, to: late}
    choices:
      - {id: help, text: Помочь, effects: {loyalty: 10, safety: 20}, review: Верно, to: done}
      - {id: pills, text: Дать свою таблетку, effects: {safety: -30}, review: Нельзя, to: late}
  late: {text: Поздно, final: bad}
  done: {text: Помогли, final: good}
`),
);

// Генератор с зерном (mulberry32): одна и та же последовательность при одном зерне
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

describe('simulateRun', () => {
  it('сильный сотрудник выбирает вариант с лучшим влиянием на шкалы', () => {
    const run = simulateRun(script, seeded(1), 1);
    expect(run.outcome).toBe('good');
    expect(run.decisions.map((decision) => decision.choiceId)).toEqual(['help']);
    expect(run.state).toEqual({ nodeId: 'done', loyalty: 60, safety: 70 });
  });

  it('прохождение всегда доходит до финала и записывает решения по правилам движка', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const run = simulateRun(script, seeded(seed), 0.35);
      expect(['good', 'bad']).toContain(run.outcome);
      expect(run.decisions).toHaveLength(1);
    }
  });

  it('слабый сотрудник иногда не успевает — таймаут записан как решение без варианта', () => {
    const outcomes = Array.from({ length: 200 }, (_, seed) => simulateRun(script, seeded(seed), 0).decisions[0].choiceId);
    expect(outcomes).toContain(null);
  });
});
