import { parse } from 'yaml';

export type Outcome = 'good' | 'ok' | 'bad';

export interface Level {
  // Скорость на спидометре, км/ч
  speed: number;
  title: string;
  // Сколько опыта нужно для уровня
  xp: number;
}

export interface Rules {
  levels: Level[];
  xp: Record<Outcome, number>;
  reputation: { window: number };
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

  return { levels, xp, reputation: { window } };
}
