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

  it("есть слабый навык — сценарий на него, даже если есть непройденные", () => {
    const skill = { id: "safety", title: "Безопасность", value: 54, hits: 7, tests: 13 };
    const state = heroState([scenario("a", "x", true), scenario("b", "x")], { scenarioId: "a", skill });
    expect(state).toEqual({ kind: "training", scenario: scenario("a", "x", true), skill });
  });

  it("новичку — первый сценарий, даже при рекомендации", () => {
    const skill = { id: "safety", title: "Безопасность", value: null, hits: 0, tests: 0 };
    expect(heroState([scenario("a", "x"), scenario("b", "x")], { scenarioId: "b", skill })?.kind).toBe("first");
  });

  it("рекомендованного сценария нет в каталоге — следующий непройденный", () => {
    const skill = { id: "safety", title: "Безопасность", value: 54, hits: 7, tests: 13 };
    expect(heroState([scenario("a", "x", true), scenario("b", "x")], { scenarioId: "gone", skill })?.kind).toBe("next");
  });

  it("всё пройдено — каталог", () => {
    expect(heroState([scenario("a", "x", true)])).toEqual({ kind: "done" });
  });

  it("пустой каталог — нечего предложить", () => {
    expect(heroState([])).toBeNull();
  });
});
