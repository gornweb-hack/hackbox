import { describe, expect, it } from "vitest";
import { groupByCategory, heroState, type Scenario } from "./scenarios";

const scenario = (id: string, category: string, completed = false): Scenario => ({
  id,
  title: id,
  summary: "",
  category: { id: category, title: category },
  carClass: "Стандарт",
  durationMin: 3,
  order: 0,
  isNew: false,
  hasTimers: false,
  completed,
});

describe("groupByCategory", () => {
  it("категории в порядке первого сценария, сценарии внутри — по порядку каталога", () => {
    const groups = groupByCategory([scenario("a", "boarding"), scenario("b", "conflict"), scenario("c", "boarding")]);
    expect(groups.map((group) => [group.id, group.items.map((item) => item.id)])).toEqual([
      ["boarding", ["a", "c"]],
      ["conflict", ["b"]],
    ]);
  });
});

describe("heroState", () => {
  it("новичку — первый сценарий каталога", () => {
    expect(heroState([scenario("a", "x"), scenario("b", "x")])).toEqual({ kind: "first", scenario: scenario("a", "x") });
  });

  it("дальше — первый непройденный по порядку", () => {
    const state = heroState([scenario("a", "x", true), scenario("b", "x"), scenario("c", "x", true)]);
    expect(state).toEqual({ kind: "next", scenario: scenario("b", "x") });
  });

  it("всё пройдено — каталог", () => {
    expect(heroState([scenario("a", "x", true)])).toEqual({ kind: "done" });
  });

  it("пустой каталог — нечего предложить", () => {
    expect(heroState([])).toBeNull();
  });
});
