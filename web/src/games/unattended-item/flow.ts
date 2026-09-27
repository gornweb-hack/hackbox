import { type ActionId, type EventChoice, isFinished, type ItemKind, ITEMS, judge, type Result, TEA_SECONDS } from "./rules";

// Ход мини-игры «Бесхозная вещь» — чистый редьюсер: часы, поиск, диалоги, выбор действий, итог.
// Где стоит проводник и дотянулся ли он до вещи, решает вид (use-inspection.ts); сюда приходит уже
// «нашли вещь» или «тронули чужую сумку». Исход считает judge из rules.ts

export const TIME_LIMIT_S = 45;

// intro — вводная; search — осмотр, часы идут; tea — просьба о чае, часы стоят; clue — подсказка соседа;
// grab — пассажир хочет сам унести вещь; actions — выбор действий; over — итог
export type Phase = "intro" | "search" | "tea" | "clue" | "grab" | "actions" | "over";

export interface InspectionState {
  kind: ItemKind;
  plannedEvent: EventChoice["id"] | null;
  phase: Phase;
  secondsLeft: number;
  found: boolean;
  actions: ActionId[];
  // Сколько раз побеспокоили пассажиров, у которых вещь своя
  wrongTaps: number;
  event?: EventChoice;
  // Лишняя тревога — пассажиры в вагоне встревожены
  panic: boolean;
  // Сколько раз нарушили памятку — ключ красной вспышки
  alarms: number;
  hint: string;
  result: Result | null;
}

export type InspectionEvent =
  | { type: "start" }
  | { type: "tick" }
  | { type: "tea" }
  | { type: "teaAnswer"; choice: "polite" | "serve" | "ignore" }
  | { type: "attended" }
  | { type: "found" }
  | { type: "clueDone" }
  | { type: "grabAnswer"; choice: "stop" | "allow" }
  | { type: "act"; action: ActionId };

export function initialState(kind: ItemKind, plannedEvent: InspectionState["plannedEvent"]): InspectionState {
  return {
    kind,
    plannedEvent,
    phase: "intro",
    secondsLeft: TIME_LIMIT_S,
    found: false,
    actions: [],
    wrongTaps: 0,
    panic: false,
    alarms: 0,
    hint: "Найдите оставленную вещь",
    result: null,
  };
}

function finish(state: InspectionState): InspectionState {
  const result = judge({ kind: state.kind, found: state.found, actions: state.actions, wrongTaps: state.wrongTaps, event: state.event });
  return { ...state, phase: "over", result, hint: result.outcome === "bad" ? "Осмотр провален — разбор ниже" : "Осмотр завершён — разбор ниже" };
}

// После находки: подсказка соседа (если есть), затем «сам вынесу» (если выпало), затем действия
const afterClue = (state: InspectionState): InspectionState => ({ ...state, phase: state.plannedEvent === "grab" ? "grab" : "actions" });

export function reducer(state: InspectionState, event: InspectionEvent): InspectionState {
  switch (event.type) {
    case "start":
      return state.phase === "intro" ? { ...state, phase: "search" } : state;
    case "tick":
      if (state.phase !== "search") return state;
      return state.secondsLeft <= 1 ? finish({ ...state, secondsLeft: 0 }) : { ...state, secondsLeft: state.secondsLeft - 1 };
    case "tea":
      return state.phase === "search" && state.plannedEvent === "tea" && !state.event ? { ...state, phase: "tea" } : state;
    case "teaAnswer": {
      if (state.phase !== "tea") return state;
      const next: InspectionState = { ...state, phase: "search", event: { id: "tea", choice: event.choice } };
      if (event.choice !== "serve") return next;
      // Часы могли уйти в минус — тогда следующая секунда закончит осмотр
      return { ...next, secondsLeft: state.secondsLeft - TEA_SECONDS, hint: `Сходили за чаем — минус ${TEA_SECONDS} секунд осмотра` };
    }
    case "attended":
      if (state.phase !== "search") return state;
      return { ...state, wrongTaps: state.wrongTaps + 1, hint: "Рядом сидит владелец. Ищите вещь, возле которой никого нет" };
    case "found": {
      if (state.phase !== "search") return state;
      const found: InspectionState = { ...state, found: true, hint: `${ITEMS[state.kind].title}. Что делаете?` };
      return ITEMS[state.kind].clue ? { ...found, phase: "clue" } : afterClue(found);
    }
    case "clueDone":
      return state.phase === "clue" ? afterClue(state) : state;
    case "grabAnswer": {
      if (state.phase !== "grab") return state;
      const next: InspectionState = { ...state, event: { id: "grab", choice: event.choice } };
      return event.choice === "stop" ? { ...next, phase: "actions" } : finish({ ...next, alarms: state.alarms + 1 });
    }
    case "act": {
      if (state.phase !== "actions" || state.actions.includes(event.action)) return state;
      const rule = ITEMS[state.kind];
      const next: InspectionState = {
        ...state,
        actions: [...state.actions, event.action],
        alarms: state.alarms + (rule.forbidden.includes(event.action) ? 1 : 0),
        panic: state.panic || event.action in rule.excess,
      };
      return isFinished(state.kind, next.actions) ? finish(next) : next;
    }
  }
}
