// Сценарий как граф узлов из content/scenarios/<id>.yaml: реплики, варианты ответа, таймеры, финалы.
// Здесь только разбор и проверка формата; как по графу идёт прохождение — в engine.ts

export type ScaleName = 'loyalty' | 'safety';
export type Scales = Record<ScaleName, number>;
export type Outcome = 'good' | 'ok' | 'bad';

// {safety: {below: 40}} — «безопасность ниже 40»; atLeast — «не ниже»
export type Condition = Partial<Record<ScaleName, { below?: number; atLeast?: number }>>;

// Правило перехода. Срабатывает первое, чьё условие выполнено; последнее — без условия
export interface Branch {
  if?: Condition;
  node: string;
}

export interface Choice {
  id: string;
  text: string;
  effects: Partial<Scales>;
  review: string;
  to: Branch[];
}

export interface Timeout {
  effects: Partial<Scales>;
  review: string;
  to: Branch[];
}

export interface ScenarioNode {
  text: string;
  timer?: number;
  timeout?: Timeout;
  choices: Choice[];
  final?: Outcome;
}

export interface Script {
  start: string;
  nodes: Record<string, ScenarioNode>;
}

const SCALES: ScaleName[] = ['loyalty', 'safety'];
const OUTCOMES: Outcome[] = ['good', 'ok', 'bad'];

type Fields = Record<string, unknown>;
const isObject = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function requireText(fields: Fields, field: string, where: string): string {
  const value = fields[field];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${where}: нет поля ${field}`);
  return value.trim();
}

function parseEffects(value: unknown, where: string): Partial<Scales> {
  if (value === undefined) return {};
  if (!isObject(value)) throw new Error(`${where}: effects — это {loyalty: …, safety: …}`);
  const effects: Partial<Scales> = {};
  for (const [scale, delta] of Object.entries(value)) {
    if (!SCALES.includes(scale as ScaleName)) throw new Error(`${where}: неизвестная шкала «${scale}»`);
    if (typeof delta !== 'number') throw new Error(`${where}: изменение шкалы ${scale} должно быть числом`);
    effects[scale as ScaleName] = delta;
  }
  return effects;
}

function parseCondition(value: unknown, where: string): Condition {
  if (!isObject(value)) throw new Error(`${where}: условие — это {safety: {below: 40}}`);
  const condition: Condition = {};
  for (const [scale, rule] of Object.entries(value)) {
    if (!SCALES.includes(scale as ScaleName)) throw new Error(`${where}: неизвестная шкала «${scale}»`);
    const valid =
      isObject(rule) &&
      Object.entries(rule).every(([key, limit]) => (key === 'below' || key === 'atLeast') && typeof limit === 'number');
    if (!valid) throw new Error(`${where}: в условии по шкале ${scale} нужны числа below или atLeast`);
    condition[scale as ScaleName] = rule as { below?: number; atLeast?: number };
  }
  return condition;
}

// to — это узел или список правил [{if, node}, …, {node}]
function parseTransition(value: unknown, where: string): Branch[] {
  if (typeof value === 'string') return [{ node: value }];
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${where}: to — это узел или список правил`);
  return value.map((item: unknown, index) => {
    if (!isObject(item) || typeof item.node !== 'string') throw new Error(`${where}: у правила №${index + 1} нет node`);
    const last = index === value.length - 1;
    // Правило без условия срабатывает всегда: после него остальные недостижимы, а без него переход может не найтись
    if (last && item.if !== undefined) throw new Error(`${where}: последнее правило должно быть без if`);
    if (!last && item.if === undefined) throw new Error(`${where}: без if может быть только последнее правило`);
    return item.if === undefined ? { node: item.node } : { if: parseCondition(item.if, where), node: item.node };
  });
}

function parseNode(raw: Fields, where: string): ScenarioNode {
  const text = requireText(raw, 'text', where);

  if (raw.final !== undefined) {
    if (!OUTCOMES.includes(raw.final as Outcome)) throw new Error(`${where}: final — это good, ok или bad`);
    if (raw.choices !== undefined || raw.timer !== undefined) throw new Error(`${where}: у финала не бывает вариантов и таймера`);
    return { text, choices: [], final: raw.final as Outcome };
  }

  if (!Array.isArray(raw.choices) || raw.choices.length === 0) throw new Error(`${where}: нет вариантов choices`);
  const choices = raw.choices.map((item: unknown, index): Choice => {
    const at = `${where}, вариант №${index + 1}`;
    if (!isObject(item)) throw new Error(`${at}: ожидается описание варианта`);
    return {
      id: requireText(item, 'id', at),
      text: requireText(item, 'text', at),
      effects: parseEffects(item.effects, at),
      review: requireText(item, 'review', at),
      to: parseTransition(item.to, at),
    };
  });
  const ids = choices.map((choice) => choice.id);
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) throw new Error(`${where}: вариант ${repeated} повторяется`);

  if (raw.timer === undefined) {
    if (raw.timeout !== undefined) throw new Error(`${where}: timeout без timer`);
    return { text, choices };
  }
  if (typeof raw.timer !== 'number' || raw.timer <= 0) throw new Error(`${where}: timer — число секунд больше нуля`);
  if (!isObject(raw.timeout)) throw new Error(`${where}: у таймера нет timeout — куда ведёт истёкшее время`);
  const at = `${where}, timeout`;
  const timeout = {
    effects: parseEffects(raw.timeout.effects, at),
    review: requireText(raw.timeout, 'review', at),
    to: parseTransition(raw.timeout.to, at),
  };
  return { text, choices, timer: raw.timer, timeout };
}

// Граф из полей start и nodes файла сценария. Все переходы должны вести в существующие узлы
export function parseScript(fields: Fields): Script {
  if (typeof fields.start !== 'string') throw new Error('нет поля start — с какого узла начинается сценарий');
  if (!isObject(fields.nodes)) throw new Error('нет узлов nodes');

  const nodes: Record<string, ScenarioNode> = {};
  for (const [id, raw] of Object.entries(fields.nodes)) {
    if (!isObject(raw)) throw new Error(`узел ${id}: ожидается описание узла`);
    nodes[id] = parseNode(raw, `узел ${id}`);
  }

  if (!nodes[fields.start]) throw new Error(`start ведёт в несуществующий узел «${fields.start}»`);
  for (const [id, node] of Object.entries(nodes)) {
    const branches = [...node.choices.flatMap((choice) => choice.to), ...(node.timeout?.to ?? [])];
    const missing = branches.find((branch) => !nodes[branch.node]);
    if (missing) throw new Error(`узел ${id}: переход в несуществующий узел «${missing.node}»`);
  }
  return { start: fields.start, nodes };
}
