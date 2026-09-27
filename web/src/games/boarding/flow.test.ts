import { describe, expect, it } from "vitest";
import { type BoardingEvent, type BoardingState, initialState, reducer } from "./flow";
import { makePassenger, ROUNDS } from "./rules";

const queue = (size: number) => Array.from({ length: size }, () => makePassenger("ok", 1));
const run = (events: BoardingEvent[], from: BoardingState = initialState) => events.reduce(reducer, from);

describe("ход игры «Посадка»", () => {
  it("решение открывает разбор, «дальше» — следующего пассажира", () => {
    const state = run([{ type: "start", queue: queue(3) }, { type: "act", action: "board" }]);
    expect([state.phase, state.decisions.length, state.queue.length]).toEqual(["feedback", 1, 2]);
    const next = reducer(state, { type: "next" });
    expect([next.phase, next.queue.length, next.served]).toEqual(["passenger", 1, 2]);
  });

  it("часы идут только у двери и не во время разбора", () => {
    const state = run([{ type: "start", queue: queue(2) }, { type: "tick" }]);
    expect(state.secondsLeft).toBe(ROUNDS[1].seconds - 1);
    expect(run([{ type: "act", action: "board" }, { type: "tick" }], state).secondsLeft).toBe(ROUNDS[1].seconds - 1);
  });

  it("время вышло — пассажир у двери и очередь идут в «не успели», двери закрываются", () => {
    const started = run([{ type: "start", queue: queue(4) }]);
    const state = run(Array.from({ length: ROUNDS[1].seconds }, () => ({ type: "tick" }) as const), started);
    expect([state.phase, state.missed, state.current]).toEqual(["closing", 4, null]);
  });

  it("очередь кончилась — рейс закрывается без «не успели», дальше брифинг следующего рейса", () => {
    const state = run([{ type: "start", queue: queue(1) }, { type: "act", action: "board" }, { type: "next" }]);
    expect([state.phase, state.missed]).toEqual(["closing", 0]);
    const briefing = reducer(state, { type: "closed" });
    expect([briefing.phase, briefing.round, briefing.secondsLeft]).toEqual(["briefing", 2, ROUNDS[2].seconds]);
  });

  it("после третьего рейса — опоздавший, его разбор и итог", () => {
    const closing: BoardingState = { ...initialState, round: 3, phase: "closing" };
    const state = run([{ type: "closed" }, { type: "late", opened: false }, { type: "finish" }], closing);
    expect([state.phase, state.lateOpened]).toEqual(["done", false]);
  });
});
