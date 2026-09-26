import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { parseScript } from './script.js';

const valid = `
start: ask
nodes:
  ask:
    text: Пассажиру плохо
    timer: 15
    timeout: {effects: {safety: -25}, review: Медлили, to: late}
    choices:
      - {id: help, text: Помочь, effects: {loyalty: 10, safety: 20}, review: Верно, to: done}
      - id: pills
        text: Дать свою таблетку
        effects: {safety: -30}
        review: Нельзя
        to:
          - {if: {safety: {below: 40}}, node: late}
          - {node: done}
  late: {text: Поздно, final: bad}
  done: {text: Помогли, final: good}
`;

// Сценарий из valid с одной правкой: заменить фрагмент текста YAML
const broken = (from: string, to: string) => () => parseScript(parse(valid.replace(from, to)));

describe('parseScript', () => {
  it('разбирает граф: переход-строку превращает в правило, таймер — в timeout', () => {
    const script = parseScript(parse(valid));
    expect(script.start).toBe('ask');
    expect(script.nodes.ask.timer).toBe(15);
    expect(script.nodes.ask.timeout).toEqual({ effects: { safety: -25 }, review: 'Медлили', to: [{ node: 'late' }] });
    expect(script.nodes.ask.choices[0].to).toEqual([{ node: 'done' }]);
    expect(script.nodes.ask.choices[1].to).toEqual([{ if: { safety: { below: 40 } }, node: 'late' }, { node: 'done' }]);
    expect(script.nodes.done).toEqual({ text: 'Помогли', choices: [], final: 'good' });
  });

  it('start ведёт в несуществующий узел', () => {
    expect(broken('start: ask', 'start: nowhere')).toThrow('start ведёт в несуществующий узел «nowhere»');
  });

  it('переход в несуществующий узел', () => {
    expect(broken('to: done}', 'to: finish}')).toThrow('узел ask: переход в несуществующий узел «finish»');
  });

  it('у финала не бывает вариантов', () => {
    expect(broken('{text: Поздно, final: bad}', '{text: Поздно, final: bad, choices: []}')).toThrow('у финала не бывает вариантов');
  });

  it('у обычного узла нужны варианты', () => {
    expect(broken('{text: Помогли, final: good}', '{text: Помогли}')).toThrow('узел done: нет вариантов choices');
  });

  it('варианты в узле не повторяются', () => {
    expect(broken('id: pills', 'id: help')).toThrow('узел ask: вариант help повторяется');
  });

  it('у таймера должен быть timeout', () => {
    expect(broken('timeout: {effects: {safety: -25}, review: Медлили, to: late}', '')).toThrow('у таймера нет timeout');
  });

  it('последнее правило перехода — без условия', () => {
    expect(broken('- {node: done}', '- {if: {loyalty: {atLeast: 50}}, node: done}')).toThrow('последнее правило должно быть без if');
  });

  it('неизвестная шкала', () => {
    expect(broken('{safety: -30}', '{comfort: -30}')).toThrow('неизвестная шкала «comfort»');
  });

  it('условие — только below или atLeast', () => {
    expect(broken('{below: 40}', '{under: 40}')).toThrow('нужны числа below или atLeast');
  });
});
