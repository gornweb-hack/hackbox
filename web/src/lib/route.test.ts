import { describe, expect, it } from "vitest";
import type { Level } from "./gamification";
import { bestRuns, buildRoute, nextStop, trainPosition, upcomingBySegment } from "./route";
import type { RunSummary } from "./runs";
import type { Scenario } from "./scenarios";

const LEVELS: Level[] = [
  { speed: 60, title: "Стажёр", xp: 0 },
  { speed: 120, title: "Проводник", xp: 300 },
  { speed: 200, title: "Старший проводник", xp: 800 },
  { speed: 250, title: "Наставник смены", xp: 1500 },
  { speed: 300, title: "Инструктор бригады", xp: 2500 },
  { speed: 400, title: "Мастер ВСМ", xp: 4000 },
];

const scenario = (id: string, completed = false) => ({ id, completed }) as Scenario;

describe("buildRoute", () => {
  it("станции — уровни, перегонов на один меньше", () => {
    const route = buildRoute(LEVELS, []);
    expect(route.map((segment) => `${segment.from.speed}→${segment.to.speed}`)).toEqual(["60→120", "120→200", "200→250", "250→300", "300→400"]);
  });

  it("остановки по порядку и равномерно: 4 сценария на 5 перегонов, 8 — по одному-два", () => {
    const four = buildRoute(LEVELS, ["a", "b", "c", "d"].map((id) => scenario(id)));
    expect(four.map((segment) => segment.stops.map((stop) => stop.id).join(""))).toEqual(["a", "b", "c", "d", ""]);
    const eight = buildRoute(LEVELS, "abcdefgh".split("").map((id) => scenario(id)));
    expect(eight.map((segment) => segment.stops.map((stop) => stop.id).join(""))).toEqual(["ab", "cd", "e", "fg", "h"]);
  });
});

describe("trainPosition", () => {
  it("доля пути по перегону между порогами опыта", () => {
    expect(trainPosition(LEVELS, 0)).toEqual({ segment: 0, share: 0 });
    expect(trainPosition(LEVELS, 150)).toEqual({ segment: 0, share: 0.5 });
    expect(trainPosition(LEVELS, 800)).toEqual({ segment: 2, share: 0 });
  });

  it("после последнего порога поезд стоит на конечной", () => {
    expect(trainPosition(LEVELS, 9000)).toEqual({ segment: 4, share: 1 });
  });
});

describe("nextStop", () => {
  it("первый непройденный сценарий", () => {
    expect(nextStop([scenario("a", true), scenario("b"), scenario("c")])?.id).toBe("b");
    expect(nextStop([scenario("a", true)])).toBeUndefined();
  });
});

describe("bestRuns", () => {
  const run = (id: string, scenarioId: string, outcome: RunSummary["outcome"], safety: number, loyalty = 50) =>
    ({ id, scenarioId, outcome, safety, loyalty, title: null, finishedAt: "2026-09-27T10:00:00Z" }) as RunSummary;

  it("лучший исход, при равном — выше безопасность", () => {
    const best = bestRuns([run("1", "a", "ok", 90), run("2", "a", "good", 40), run("3", "b", "bad", 70), run("4", "b", "bad", 80)]);
    expect([best.get("a")?.id, best.get("b")?.id]).toEqual(["2", "4"]);
  });
});

describe("upcomingBySegment", () => {
  const upcoming = [
    { title: "X", category: "", memo: 1 },
    { title: "Y", category: "", memo: 2 },
  ];

  it("анонсы встают на пустые перегоны с конца маршрута", () => {
    // 3 сценария на 5 перегонов встают на перегоны 0, 1 и 3 — пустые 2 и 4
    const route = buildRoute(LEVELS, ["a", "b", "c"].map((id) => scenario(id)));
    const placed = upcomingBySegment(route, upcoming);
    expect([...placed.entries()].map(([segment, item]) => `${segment}:${item.title}`)).toEqual(["2:X", "4:Y"]);
  });

  it("пустой перегон один — встаёт последний анонс", () => {
    const route = buildRoute(LEVELS, ["a", "b", "c", "d"].map((id) => scenario(id)));
    expect([...upcomingBySegment(route, upcoming).entries()].map(([segment, item]) => `${segment}:${item.title}`)).toEqual(["4:Y"]);
  });
});
