import { parse } from 'yaml';

export type Outcome = 'good' | 'ok' | 'bad';

export interface Level {
  // Скорость на спидометре, км/ч
  speed: number;
  title: string;
  // Сколько опыта нужно для уровня
  xp: number;
}

// Условия на одно прохождение: все заданные должны выполниться.
// noTimeouts — в прохождении были решения на время и ни одного таймаута
export interface RunCondition {
  category?: string;
  outcome?: Outcome;
  minLoyalty?: number;
  minSafety?: number;
  noTimeouts?: true;
}

// Когда ачивка получена: после N прохождений, после N разных категорий или за одно подходящее прохождение
export type AchievementRule = { runs: number } | { categories: number } | { run: RunCondition };

export interface Achievement {
  id: string;
  title: string;
  description: string;
  when: AchievementRule;
}

export interface Rules {
  levels: Level[];
  xp: Record<Outcome, number>;
  reputation: { window: number };
  achievements: Achievement[];
}

const OUTCOMES: Outcome[] = ['good', 'ok', 'bad'];
// Шкала спидометра на главной — до 400 км/ч
const MAX_SPEED = 400;

type Fields = Record<string, unknown>;
const isObject = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function number(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${where} должно быть числом`);
  return value;
}

// content/gamification.yaml: уровни, опыт за исход прохождения и окно репутации
export function parseRules(text: string): Rules {
  const data: unknown = parse(text);
  if (!isObject(data)) throw new Error('ожидаются поля levels, xp и reputation');

  if (!Array.isArray(data.levels) || data.levels.length === 0) throw new Error('нет уровней levels');
  const levels = data.levels.map((item: unknown, index): Level => {
    const at = `уровень №${index + 1}`;
    if (!isObject(item) || typeof item.title !== 'string' || !item.title.trim()) throw new Error(`${at}: нет title`);
    const speed = number(item.speed, `${at}: speed`);
    if (speed <= 0 || speed > MAX_SPEED) throw new Error(`${at}: скорость — от 1 до ${MAX_SPEED} км/ч, как на спидометре`);
    return { speed, title: item.title.trim(), xp: number(item.xp, `${at}: xp`) };
  });
  if (levels[0].xp !== 0) throw new Error('у первого уровня порог опыта должен быть 0');
  levels.forEach((level, index) => {
    const previous = levels[index - 1];
    if (previous && (level.xp <= previous.xp || level.speed <= previous.speed)) {
      throw new Error(`уровень №${index + 1}: скорость и порог опыта должны расти`);
    }
  });

  if (!isObject(data.xp)) throw new Error('нет опыта за исход xp');
  const xpTable = data.xp;
  const xp = Object.fromEntries(OUTCOMES.map((outcome) => [outcome, number(xpTable[outcome], `xp.${outcome}`)])) as Record<Outcome, number>;

  const window = isObject(data.reputation) ? number(data.reputation.window, 'reputation.window') : 0;
  if (window < 1) throw new Error('reputation.window — сколько прохождений усреднять, больше нуля');

  return { levels, xp, reputation: { window }, achievements: parseAchievements(data.achievements) };
}

function parseAchievements(value: unknown): Achievement[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('achievements — список ачивок');
  const achievements = value.map((item: unknown, index): Achievement => {
    const at = `ачивка №${index + 1}`;
    if (!isObject(item)) throw new Error(`${at}: ожидается описание ачивки`);
    const text = (field: string) => {
      const raw = item[field];
      if (typeof raw !== 'string' || !raw.trim()) throw new Error(`${at}: нет поля ${field}`);
      return raw.trim();
    };
    return { id: text('id'), title: text('title'), description: text('description'), when: parseRule(item.when, `${at}: when`) };
  });
  const ids = achievements.map((achievement) => achievement.id);
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) throw new Error(`ачивка ${repeated} повторяется`);
  return achievements;
}

function parseRule(value: unknown, where: string): AchievementRule {
  if (!isObject(value) || Object.keys(value).length !== 1) {
    throw new Error(`${where} — одно правило: runs, categories или run`);
  }
  if (value.runs !== undefined) return { runs: count(value.runs, `${where}.runs`) };
  if (value.categories !== undefined) return { categories: count(value.categories, `${where}.categories`) };
  if (!isObject(value.run) || Object.keys(value.run).length === 0) {
    throw new Error(`${where} — одно правило: runs, categories или run с условиями`);
  }
  const condition: RunCondition = {};
  for (const [key, rule] of Object.entries(value.run)) {
    const at = `${where}.run.${key}`;
    if (key === 'category' && typeof rule === 'string') condition.category = rule;
    else if (key === 'outcome' && OUTCOMES.includes(rule as Outcome)) condition.outcome = rule as Outcome;
    else if (key === 'minLoyalty' || key === 'minSafety') condition[key] = number(rule, at);
    else if (key === 'noTimeouts' && rule === true) condition.noTimeouts = true;
    else throw new Error(`${at}: неизвестное условие или значение`);
  }
  return { run: condition };
}

// Сколько раз нужно: целое число больше нуля
function count(value: unknown, where: string): number {
  const result = number(value, where);
  if (!Number.isInteger(result) || result < 1) throw new Error(`${where} — целое число больше нуля`);
  return result;
}
