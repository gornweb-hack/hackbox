import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { applyChoice, applyTimeout, resolveAction, startState, TIMER_GRACE_MS, timerState } from './engine.js';
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
      - {id: help, text: Помочь, effects: {loyalty: 10, safety: 60}, review: Верно, to: done}
      - id: pills
        text: Дать свою таблетку
        effects: {safety: -30}
        review: Нельзя
        to:
          - {if: {safety: {below: 40}}, node: late}
          - {node: done}
  late: {text: Поздно, final: bad}
  done: {text: Помогли, final: good}
`),
);

describe('движок', () => {
  it('прохождение начинается с узла start и шкал 50/50', () => {
    expect(startState(script)).toEqual({ nodeId: 'ask', loyalty: 50, safety: 50 });
  });

  it('выбор меняет шкалы, обрезает их до 100 и пишет фактическое изменение', () => {
    const { state, decision } = applyChoice(script, startState(script), 'help');
    expect(state).toEqual({ nodeId: 'done', loyalty: 60, safety: 100 });
    expect(decision).toEqual({
      nodeId: 'ask',
      choiceId: 'help',
      prompt: 'Пассажиру плохо',
      answer: 'Помочь',
      review: 'Верно',
      loyaltyDelta: 10,
      safetyDelta: 50,
    });
  });

  it('условный переход смотрит на шкалы после решения', () => {
    // 50 − 30 = 20, ниже 40 — пассажиру становится хуже
    expect(applyChoice(script, startState(script), 'pills').state.nodeId).toBe('late');
    // 90 − 30 = 60 — обошлось
    expect(applyChoice(script, { nodeId: 'ask', loyalty: 50, safety: 90 }, 'pills').state.nodeId).toBe('done');
  });

  it('истёкшее время ведёт по ветке timeout', () => {
    const { state, decision } = applyTimeout(script, startState(script));
    expect(state).toEqual({ nodeId: 'late', loyalty: 50, safety: 25 });
    expect(decision).toMatchObject({ choiceId: null, answer: 'Время вышло', review: 'Медлили', safetyDelta: -25 });
  });

  it('неизвестный вариант', () => {
    expect(() => applyChoice(script, startState(script), 'shout')).toThrow('Такого варианта ответа нет');
  });

  it('после финала решений нет', () => {
    expect(() => applyChoice(script, { nodeId: 'done', loyalty: 50, safety: 50 }, 'help')).toThrow('Прохождение уже завершено');
  });

  it('узел удалили из YAML во время прохождения', () => {
    expect(() => applyChoice(script, { nodeId: 'gone', loyalty: 50, safety: 50 }, 'help')).toThrow('Сценарий изменился');
  });
});

describe('таймер', () => {
  const node = script.nodes.ask;
  const shownAt = 0;
  const deadline = 15_000;

  it('выбор вовремя засчитывается', () => {
    expect(resolveAction(node, shownAt, 10_000, 'help')).toBe('help');
    expect(resolveAction(node, shownAt, deadline + TIMER_GRACE_MS - 1, 'help')).toBe('help');
  });

  it('опоздавший выбор — это истёкшее время', () => {
    expect(resolveAction(node, shownAt, deadline + TIMER_GRACE_MS + 1, 'help')).toBeNull();
  });

  it('«время вышло» принимается только после дедлайна', () => {
    expect(() => resolveAction(node, shownAt, 5_000, undefined)).toThrow('Время на решение ещё не вышло');
    expect(resolveAction(node, shownAt, deadline - TIMER_GRACE_MS + 1, undefined)).toBeNull();
  });

  it('без таймера нужно выбрать вариант', () => {
    expect(() => resolveAction(script.nodes.done, shownAt, 5_000, undefined)).toThrow('Выберите вариант ответа');
  });

  it('оставшееся время не уходит в минус, у узла без таймера его нет', () => {
    expect(timerState(node, shownAt, 5_000)).toEqual({ seconds: 15, remainingMs: 10_000 });
    expect(timerState(node, shownAt, 60_000)).toEqual({ seconds: 15, remainingMs: 0 });
    expect(timerState(script.nodes.done, shownAt, 5_000)).toBeUndefined();
  });
});
