import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { parseScript } from '../scenarios/script.js';
import { parseSkills, recommend, type SkillRun, skillScores, weakest } from './skills.js';

const { skills } = parseSkills(`
window: 10
skills:
  - {id: acknowledge, title: Признать ситуацию}
  - {id: safety, title: Безопасность}
  - {id: composure, title: Хладнокровие, timers: true}
`);
const [acknowledge, safety, composure] = skills;

// ask проверяет «признать» и «безопасность», у него таймер; calm — только «безопасность»
const medical = parseScript(
  parse(`
start: ask
nodes:
  ask:
    text: Пассажиру плохо
    timer: 15
    timeout: {review: Медлили, to: calm}
    choices:
      - {id: help, text: Помочь, skills: [acknowledge, safety], review: Верно, to: calm}
      - {id: pills, text: Дать таблетку, review: Нельзя, to: calm}
  calm:
    text: Соседи волнуются
    choices:
      - {id: announce, text: Объявить спокойно, skills: [safety], review: Верно, to: done}
      - {id: shout, text: Крикнуть, review: Паника, to: done}
  done: {text: Помогли, final: good}
`),
);
// Сценарий без навыка «безопасность»
const service = parseScript(
  parse(`
start: ask
nodes:
  ask:
    text: Душно
    choices:
      - {id: climate, text: Настроить климат, skills: [acknowledge], review: Верно, to: done}
  done: {text: Легче, final: good}
`),
);
const scripts = new Map([
  ['medical', medical],
  ['service', service],
]);

const run = (scenarioId: string, decisions: [string, string | null][]): SkillRun => ({
  scenarioId,
  finishedAt: new Date(),
  decisions: decisions.map(([nodeId, choiceId]) => ({ nodeId, choiceId })),
});

describe('parseSkills', () => {
  it('отклоняет повтор id', () => {
    expect(() => parseSkills('window: 5\nskills: [{id: a, title: А}, {id: a, title: Б}]')).toThrow('навык a повторяется');
  });

  it('window — целое больше нуля', () => {
    expect(() => parseSkills('window: 0\nskills: [{id: a, title: А}]')).toThrow('window');
  });
});

describe('skillScores — процент верных решений', () => {
  it('верно — выбран вариант с меткой; узел проверяет навык, если метка есть хоть у одного варианта', () => {
    const scores = skillScores([run('medical', [['ask', 'pills'], ['calm', 'announce']])], scripts, skills);
    expect(scores.find((score) => score.id === 'safety')).toMatchObject({ value: 50, hits: 1, tests: 2 });
    expect(scores.find((score) => score.id === 'acknowledge')).toMatchObject({ value: 0, hits: 0, tests: 1 });
  });

  it('хладнокровие — решения на время, принятые до таймаута', () => {
    const scores = skillScores([run('medical', [['ask', 'pills']]), run('medical', [['ask', null]])], scripts, [composure]);
    expect(scores[0]).toMatchObject({ value: 50, hits: 1, tests: 2 });
  });

  it('таймаут — неверное решение и по меткам', () => {
    expect(skillScores([run('medical', [['ask', null]])], scripts, [acknowledge])[0]).toMatchObject({ value: 0, tests: 1 });
  });

  it('навык, который не проверялся, — null', () => {
    expect(skillScores([run('service', [['ask', 'climate']])], scripts, [safety])[0].value).toBeNull();
  });

  it('решения в удалённых узлах пропускаются', () => {
    expect(skillScores([run('medical', [['gone', 'help']])], scripts, [safety])[0].tests).toBe(0);
  });
});

describe('weakest — слабый навык', () => {
  it('наименьший процент среди проверявшихся, при равенстве — первый по списку', () => {
    const scores = [
      { id: 'a', title: 'А', value: 40, hits: 2, tests: 5 },
      { id: 'b', title: 'Б', value: null, hits: 0, tests: 0 },
      { id: 'c', title: 'В', value: 40, hits: 4, tests: 10 },
    ];
    expect(weakest(scores)?.id).toBe('a');
  });

  it('все проверенные навыки на 100% — слабого нет', () => {
    const scores = [
      { id: 'a', title: 'А', value: 100, hits: 3, tests: 3 },
      { id: 'b', title: 'Б', value: null, hits: 0, tests: 0 },
    ];
    expect(weakest(scores)).toBeNull();
  });

  it('без проверок слабого навыка нет', () => {
    expect(weakest([{ id: 'a', title: 'А', value: null, hits: 0, tests: 0 }])).toBeNull();
  });
});

describe('recommend — что потренировать', () => {
  const scenarios = [
    { id: 'service', script: service },
    { id: 'medical', script: medical },
  ];

  it('сценарий, где навык проверяется в наибольшем числе узлов', () => {
    expect(recommend(safety, scenarios, new Map())).toBe('medical');
  });

  it('при равенстве — тот, что дольше не проходили', () => {
    const lastPlayed = new Map([['service', new Date('2026-09-20')]]);
    expect(recommend(acknowledge, scenarios, lastPlayed)).toBe('medical');
  });

  it('если навык нигде не проверяется — рекомендации нет', () => {
    expect(recommend({ id: 'rule', title: 'Правило', timers: false }, scenarios, new Map())).toBeNull();
  });
});
