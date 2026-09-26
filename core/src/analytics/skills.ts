import { parse } from 'yaml';
import type { Script, ScenarioNode } from '../scenarios/script.js';

export interface Skill {
  id: string;
  title: string;
  // Навык без меток: его проверяет каждый узел с таймером, верно — успеть до таймаута
  timers: boolean;
}

export interface SkillsConfig {
  // Процент считается по стольким последним прохождениям
  window: number;
  skills: Skill[];
}

type Fields = Record<string, unknown>;
const isObject = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// content/skills.yaml: оси радара и окно, за которое считается процент
export function parseSkills(text: string): SkillsConfig {
  const data: unknown = parse(text);
  if (!isObject(data)) throw new Error('ожидаются поля window и skills');
  const window = data.window;
  if (typeof window !== 'number' || !Number.isInteger(window) || window < 1) {
    throw new Error('window — сколько последних прохождений учитывать, целое больше нуля');
  }
  if (!Array.isArray(data.skills) || data.skills.length === 0) throw new Error('нет навыков skills');
  const skills = data.skills.map((item: unknown, index): Skill => {
    const at = `навык №${index + 1}`;
    if (!isObject(item) || typeof item.id !== 'string' || !item.id.trim()) throw new Error(`${at}: нет id`);
    if (typeof item.title !== 'string' || !item.title.trim()) throw new Error(`${at}: нет title`);
    if (item.timers !== undefined && typeof item.timers !== 'boolean') throw new Error(`${at}: timers — true или false`);
    return { id: item.id.trim(), title: item.title.trim(), timers: item.timers === true };
  });
  const ids = skills.map((skill) => skill.id);
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) throw new Error(`навык ${repeated} повторяется`);
  return { window, skills };
}

// Проверяет ли узел навык: есть вариант с его меткой, а для «таймерного» навыка — таймер
export function tests(skill: Skill, node: ScenarioNode): boolean {
  return skill.timers ? node.timer !== undefined : node.choices.some((choice) => choice.skills.includes(skill.id));
}

// Верно ли решение: выбран вариант с меткой навыка, а для «таймерного» — любой вариант до таймаута (choiceId не null)
function hits(skill: Skill, node: ScenarioNode, choiceId: string | null): boolean {
  if (choiceId === null) return false;
  return skill.timers || (node.choices.find((choice) => choice.id === choiceId)?.skills.includes(skill.id) ?? false);
}

export interface SkillRun {
  scenarioId: string;
  finishedAt: Date | null;
  decisions: { nodeId: string; choiceId: string | null }[];
}

export interface SkillScore {
  id: string;
  title: string;
  // Процент верных решений 0–100; null — навык ещё ни разу не проверялся
  value: number | null;
  hits: number;
  tests: number;
}

// Навыки по решениям: процент = верные решения / решения, где навык проверялся.
// Метки берутся из текущего YAML, поэтому их правка сразу пересчитывает всех.
// Решения в узлах, которых в сценарии уже нет, пропускаются
export function skillScores(runs: SkillRun[], scripts: Map<string, Script>, skills: Skill[]): SkillScore[] {
  return skills.map((skill) => {
    let tested = 0;
    let right = 0;
    for (const run of runs) {
      const script = scripts.get(run.scenarioId);
      for (const decision of run.decisions) {
        const node = script?.nodes[decision.nodeId];
        if (!node || !tests(skill, node)) continue;
        tested += 1;
        if (hits(skill, node, decision.choiceId)) right += 1;
      }
    }
    return { id: skill.id, title: skill.title, value: tested ? Math.round((right / tested) * 100) : null, hits: right, tests: tested };
  });
}

// Слабый навык — с наименьшим процентом среди проверявшихся, при равенстве — первый по списку.
// Навык на 100% слабым не бывает: если все проверенные на 100%, тренировать нечего — null
export function weakest(scores: SkillScore[]): SkillScore | null {
  return scores.reduce<SkillScore | null>(
    (low, score) =>
      score.value !== null && score.value < 100 && (low === null || score.value < (low.value ?? 0)) ? score : low,
    null,
  );
}

// Что потренировать: сценарий, где навык проверяется в наибольшем числе узлов.
// При равенстве — тот, что дольше не проходили; ещё не пройденный — раньше всех
export function recommend(skill: Skill, scenarios: { id: string; script: Script }[], lastPlayed: Map<string, Date>): string | null {
  const ranked = scenarios
    .map(({ id, script }) => ({
      id,
      count: Object.values(script.nodes).filter((node) => tests(skill, node)).length,
      played: lastPlayed.get(id)?.getTime() ?? 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.played - b.played);
  return ranked[0]?.id ?? null;
}
