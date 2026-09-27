import { type Action, type Decision, judge, type Passenger, type Round, ROUNDS } from "./rules";

// Ход игры «Посадка» — чистый редьюсер: рейс, очередь, пассажир у двери, часы, решения.
// Случайность (очередь рейса) приходит снаружи в событии start, поэтому редьюсер детерминирован

export const LAST_ROUND: Round = 3;

// briefing — правила рейса; passenger — у двери пассажир, часы идут; feedback — разбор решения, часы стоят;
// closing — двери закрываются; late — финал с опоздавшим; lateFeedback — его разбор; done — итог
export type Phase = "briefing" | "passenger" | "feedback" | "closing" | "late" | "lateFeedback" | "done";

export interface BoardingState {
  phase: Phase;
  round: Round;
  queue: Passenger[];
  current: Passenger | null;
  // Сколько пассажиров подходило к двери за игру — ключ для анимации подхода следующего
  served: number;
  secondsLeft: number;
  decisions: Decision[];
  missed: number;
  lateOpened: boolean | null;
}

export type BoardingEvent =
  | { type: "start"; queue: Passenger[] }
  | { type: "tick" }
  | { type: "act"; action: Action }
  | { type: "next" }
  | { type: "closed" }
  | { type: "late"; opened: boolean }
  | { type: "finish" };

export const initialState: BoardingState = {
  phase: "briefing",
  round: 1,
  queue: [],
  current: null,
  served: 0,
  secondsLeft: ROUNDS[1].seconds,
  decisions: [],
  missed: 0,
  lateOpened: null,
};

// Время вышло или очередь кончилась: кто не успел — в итог как «не успели посадить», двери закрываются
function closeRound(state: BoardingState): BoardingState {
  return { ...state, phase: "closing", missed: state.missed + state.queue.length + (state.current ? 1 : 0), queue: [], current: null };
}

export function reducer(state: BoardingState, event: BoardingEvent): BoardingState {
  switch (event.type) {
    case "start": {
      if (state.phase !== "briefing") return state;
      const [current = null, ...queue] = event.queue;
      return { ...state, phase: "passenger", current, queue, served: state.served + 1, secondsLeft: ROUNDS[state.round].seconds };
    }
    case "tick":
      if (state.phase !== "passenger") return state;
      return state.secondsLeft <= 1 ? closeRound({ ...state, secondsLeft: 0 }) : { ...state, secondsLeft: state.secondsLeft - 1 };
    case "act":
      if (state.phase !== "passenger" || !state.current) return state;
      return { ...state, phase: "feedback", decisions: [...state.decisions, judge(state.current, event.action)] };
    case "next": {
      if (state.phase !== "feedback") return state;
      const [current, ...queue] = state.queue;
      return current ? { ...state, phase: "passenger", current, queue, served: state.served + 1 } : closeRound({ ...state, current: null });
    }
    case "closed": {
      if (state.phase !== "closing") return state;
      if (state.round === LAST_ROUND) return { ...state, phase: "late" };
      const round = (state.round + 1) as Round;
      return { ...state, phase: "briefing", round, secondsLeft: ROUNDS[round].seconds };
    }
    case "late":
      return state.phase === "late" ? { ...state, phase: "lateFeedback", lateOpened: event.opened } : state;
    case "finish":
      return state.phase === "lateFeedback" ? { ...state, phase: "done" } : state;
  }
}
