import { describe, expect, it } from "vitest";
import { type InspectionEvent, type InspectionState, initialState, reducer, TIME_LIMIT_S } from "./flow";
import { TEA_SECONDS } from "./rules";

const run = (events: InspectionEvent[], from: InspectionState) => events.reduce(reducer, from);
const ticks = (count: number) => Array.from({ length: count }, () => ({ type: "tick" }) as const);

describe("ход игры «Бесхозная вещь»", () => {
  it("часы идут только во время осмотра", () => {
    const intro = run(ticks(3), initialState("bag", null));
    expect(intro.secondsLeft).toBe(TIME_LIMIT_S);
    expect(run([{ type: "start" }, ...ticks(3)], intro).secondsLeft).toBe(TIME_LIMIT_S - 3);
  });

  it("время вышло — вещь не найдена, плохой исход", () => {
    const state = run([{ type: "start" }, ...ticks(TIME_LIMIT_S)], initialState("bag", null));
    expect([state.phase, state.found, state.result?.outcome]).toEqual(["over", false, "bad"]);
  });

  it("чай ставит часы на паузу, а поход за ним отнимает время", () => {
    const tea = run([{ type: "start" }, { type: "tea" }, ...ticks(5)], initialState("bag", "tea"));
    expect([tea.phase, tea.secondsLeft]).toEqual(["tea", TIME_LIMIT_S]);
    const served = reducer(tea, { type: "teaAnswer", choice: "serve" });
    expect([served.phase, served.secondsLeft, served.event]).toEqual(["search", TIME_LIMIT_S - TEA_SECONDS, { id: "tea", choice: "serve" }]);
  });

  it("чай не просят, если событие партии другое", () => {
    expect(run([{ type: "start" }, { type: "tea" }], initialState("bag", null)).phase).toBe("search");
  });

  it("находка с подсказкой соседа: сначала диалог, потом действия", () => {
    const clue = run([{ type: "start" }, { type: "found" }], initialState("backpack", null));
    expect([clue.phase, clue.found]).toEqual(["clue", true]);
    expect(reducer(clue, { type: "clueDone" }).phase).toBe("actions");
  });

  it("«пусть выносит» — сразу плохой исход и вспышка", () => {
    const state = run([{ type: "start" }, { type: "found" }, { type: "grabAnswer", choice: "allow" }], initialState("bag", "grab"));
    expect([state.phase, state.result?.outcome, state.alarms]).toEqual(["over", "bad", 1]);
  });

  it("запрещённое действие заканчивает осмотр плохим исходом", () => {
    const state = run([{ type: "start" }, { type: "found" }, { type: "act", action: "open" }], initialState("bag", null));
    expect([state.phase, state.result?.outcome, state.alarms]).toEqual(["over", "bad", 1]);
  });

  it("все обязательные шаги по порядку — хороший исход, повтор действия не считается", () => {
    const state = run(
      [{ type: "start" }, { type: "found" }, { type: "act", action: "announce" }, { type: "act", action: "announce" }, { type: "act", action: "radio" }],
      initialState("bag", null),
    );
    expect([state.phase, state.actions, state.result?.outcome]).toEqual(["over", ["announce", "radio"], "good"]);
  });

  it("лишняя тревога пугает вагон и даёт «с замечанием»", () => {
    const state = run(
      [{ type: "start" }, { type: "found" }, { type: "act", action: "radio" }, { type: "act", action: "clear" }, { type: "act", action: "ask" }],
      initialState("toy", null),
    );
    expect([state.panic, state.result?.outcome]).toEqual([true, "ok"]);
  });

  it("чужая сумка — лишнее беспокойство пассажира", () => {
    const state = run([{ type: "start" }, { type: "attended" }, { type: "attended" }], initialState("bag", null));
    expect(state.wrongTaps).toBe(2);
  });
});
