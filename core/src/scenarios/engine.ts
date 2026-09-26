import { ApiError } from '../common/api-error.js';
import type { Branch, Condition, Scales, ScenarioNode, Script } from './script.js';

// Шкалы в начале прохождения — середина, чтобы решения двигали их в обе стороны
export const START_SCALE = 50;
// Запас на задержку сети: выбор чуть позже дедлайна ещё засчитывается, «время вышло» чуть раньше — тоже
export const TIMER_GRACE_MS = 1_500;

export interface RunState extends Scales {
  nodeId: string;
}

// Решение для разбора. Тексты — снимком, изменения шкал — фактические, после обрезки до 0–100
export interface Decision {
  nodeId: string;
  // null — время вышло
  choiceId: string | null;
  prompt: string;
  answer: string;
  review: string;
  loyaltyDelta: number;
  safetyDelta: number;
}

export interface Step {
  state: RunState;
  decision: Decision;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function startState(script: Script): RunState {
  return { nodeId: script.start, loyalty: START_SCALE, safety: START_SCALE };
}

function matches(condition: Condition, scales: Scales): boolean {
  return Object.entries(condition).every(([scale, rule]) => {
    const value = scales[scale as keyof Scales];
    return (rule.below === undefined || value < rule.below) && (rule.atLeast === undefined || value >= rule.atLeast);
  });
}

// Куда ведёт решение: первое правило, чьё условие выполнено по уже изменённым шкалам.
// Последнее правило всегда без условия (это проверяет script.ts), поэтому переход находится всегда
export function resolveTransition(branches: Branch[], scales: Scales): string {
  return (branches.find((branch) => !branch.if || matches(branch.if, scales)) ?? branches[branches.length - 1]).node;
}

// Узел, в котором стоит прохождение. Его может не оказаться, если YAML поправили во время прохождения
export function currentNode(script: Script, state: RunState): ScenarioNode {
  const node = script.nodes[state.nodeId];
  if (!node) throw new ApiError(409, 'SCENARIO_CHANGED', 'Сценарий изменился — начните прохождение заново');
  if (node.final) throw new ApiError(409, 'RUN_FINISHED', 'Прохождение уже завершено');
  return node;
}

function move(
  state: RunState,
  node: ScenarioNode,
  effects: Partial<Scales>,
  to: Branch[],
  picked: Pick<Decision, 'choiceId' | 'answer' | 'review'>,
): Step {
  const loyalty = clamp(state.loyalty + (effects.loyalty ?? 0));
  const safety = clamp(state.safety + (effects.safety ?? 0));
  return {
    state: { nodeId: resolveTransition(to, { loyalty, safety }), loyalty, safety },
    decision: {
      nodeId: state.nodeId,
      prompt: node.text,
      ...picked,
      loyaltyDelta: loyalty - state.loyalty,
      safetyDelta: safety - state.safety,
    },
  };
}

export function applyChoice(script: Script, state: RunState, choiceId: string): Step {
  const node = currentNode(script, state);
  const choice = node.choices.find((item) => item.id === choiceId);
  if (!choice) throw new ApiError(422, 'CHOICE_NOT_FOUND', 'Такого варианта ответа нет');
  return move(state, node, choice.effects, choice.to, { choiceId, answer: choice.text, review: choice.review });
}

export function applyTimeout(script: Script, state: RunState): Step {
  const node = currentNode(script, state);
  if (!node.timeout) throw new ApiError(422, 'CHOICE_REQUIRED', 'Выберите вариант ответа');
  return move(state, node, node.timeout.effects, node.timeout.to, {
    choiceId: null,
    answer: 'Время вышло',
    review: node.timeout.review,
  });
}

// Что засчитать: выбор или истёкшее время. Время сверяет сервер — часам и таймеру клиента не доверяем.
// Возвращает id варианта или null, если время вышло
export function resolveAction(node: ScenarioNode, shownAt: number, now: number, choiceId: string | undefined): string | null {
  const deadline = node.timer === undefined ? null : shownAt + node.timer * 1000;
  if (choiceId === undefined) {
    if (deadline === null) throw new ApiError(422, 'CHOICE_REQUIRED', 'Выберите вариант ответа');
    if (now < deadline - TIMER_GRACE_MS) throw new ApiError(422, 'TIMER_NOT_EXPIRED', 'Время на решение ещё не вышло');
    return null;
  }
  // Выбор, сделанный после дедлайна, засчитывается как истёкшее время
  return deadline !== null && now > deadline + TIMER_GRACE_MS ? null : choiceId;
}
