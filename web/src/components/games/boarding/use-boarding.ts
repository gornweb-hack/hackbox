"use client";

import { useEffect, useReducer, useRef } from "react";
import { initialState, reducer } from "@/games/boarding/flow";
import { type Action, makeQueue, type Result, summarize } from "@/games/boarding/rules";

// Сколько закрываются двери между рейсами
const CLOSING_MS = 900;

// Состояние игры «Посадка» и таймеры вокруг чистого редьюсера из games/boarding/flow.ts:
// часы тикают, только пока у двери пассажир, двери закрываются с паузой, итог уходит в onFinish
export function useBoarding(onFinish: (result: Result) => void) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    if (state.phase !== "passenger") return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "closing") return;
    const timer = setTimeout(() => dispatch({ type: "closed" }), CLOSING_MS);
    return () => clearTimeout(timer);
  }, [state.phase]);

  const { phase, decisions, missed, lateOpened } = state;
  useEffect(() => {
    if (phase === "done") onFinishRef.current(summarize(decisions, missed, lateOpened));
  }, [phase, decisions, missed, lateOpened]);

  return {
    state,
    // Очередь рейса случайна, поэтому собирается здесь, а не в редьюсере
    start: () => dispatch({ type: "start", queue: makeQueue(state.round) }),
    act: (action: Action) => dispatch({ type: "act", action }),
    next: () => dispatch({ type: "next" }),
    late: (opened: boolean) => dispatch({ type: "late", opened }),
    finish: () => dispatch({ type: "finish" }),
  };
}
