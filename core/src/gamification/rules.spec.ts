import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseRules } from './rules.js';

const valid = `
levels:
  - {speed: 60, title: Стажёр, xp: 0}
  - {speed: 120, title: Проводник, xp: 300}
xp: {good: 150, ok: 100, bad: 50}
reputation: {window: 10}
`;

const broken = (from: string, to: string) => () => parseRules(valid.replace(from, to));

describe('parseRules', () => {
  it('разбирает уровни, опыт за исход и окно репутации', () => {
    expect(parseRules(valid)).toEqual({
      levels: [
        { speed: 60, title: 'Стажёр', xp: 0 },
        { speed: 120, title: 'Проводник', xp: 300 },
      ],
      xp: { good: 150, ok: 100, bad: 50 },
      reputation: { window: 10 },
      achievements: [],
    });
  });

  it('разбирает ачивки трёх видов', () => {
    const rules = parseRules(`${valid}
achievements:
  - {id: first, title: Первый рейс, description: Первый сценарий, when: {runs: 1}}
  - {id: all, title: Универсал, description: Все категории, when: {categories: 4}}
  - {id: aid, title: Первая помощь, description: Медицина на отлично, when: {run: {category: medical, outcome: good}}}
`);
    expect(rules.achievements.map((achievement) => achievement.when)).toEqual([
      { runs: 1 },
      { categories: 4 },
      { run: { category: 'medical', outcome: 'good' } },
    ]);
  });

  it('у ачивки одно правило и известные условия', () => {
    const achievement = (when: string) => () =>
      parseRules(`${valid}\nachievements:\n  - {id: a, title: A, description: B, when: ${when}}`);
    expect(achievement('{runs: 1, categories: 2}')).toThrow('одно правило');
    expect(achievement('{run: {minSpeed: 5}}')).toThrow('неизвестное условие');
    expect(achievement('{runs: 0}')).toThrow('целое число больше нуля');
  });

  it('первый порог — 0', () => {
    expect(broken('title: Стажёр, xp: 0', 'title: Стажёр, xp: 10')).toThrow('порог опыта должен быть 0');
  });

  it('уровни растут', () => {
    expect(broken('xp: 300', 'xp: 0')).toThrow('скорость и порог опыта должны расти');
  });

  it('скорость помещается на спидометр', () => {
    expect(broken('speed: 120', 'speed: 450')).toThrow('от 1 до 400 км/ч');
  });

  it('опыт задан для всех исходов', () => {
    expect(broken(', bad: 50', '')).toThrow('xp.bad должно быть числом');
  });

  it('окно репутации больше нуля', () => {
    expect(broken('window: 10', 'window: 0')).toThrow('reputation.window');
  });

  it('настоящий content/gamification.yaml проходит проверку', async () => {
    const text = await readFile(join(process.cwd(), '..', 'content', 'gamification.yaml'), 'utf8');
    expect(parseRules(text).levels).toHaveLength(6);
  });
});
