import { describe, expect, it } from "vitest";
import { decisionTone, formatDelta, zoneOf } from "./scales";

describe("zoneOf", () => {
  it("границы зон как в макете: 0–30, 31–60, 61–100", () => {
    expect([0, 30, 31, 60, 61, 100].map((value) => zoneOf(value).tone)).toEqual([
      "red",
      "red",
      "yellow",
      "yellow",
      "green",
      "green",
    ]);
    expect(zoneOf(58).label).toBe("Внимание · 31–60");
  });
});

describe("formatDelta", () => {
  it("плюс, настоящий минус и ноль", () => {
    expect([formatDelta(15), formatDelta(-20), formatDelta(0)]).toEqual(["+15", "−20", "0"]);
  });
});

describe("decisionTone", () => {
  const tone = (loyaltyDelta: number, safetyDelta: number, timedOut = false) =>
    decisionTone({ loyaltyDelta, safetyDelta, timedOut });

  it("таймаут и сильное падение безопасности — плохо, даже если лояльность выросла", () => {
    expect([tone(15, 20, true), tone(5, -30), tone(-10, 5)]).toEqual(["bad", "bad", "bad"]);
  });

  it("рост на 20 и больше — хорошо, небольшой — нейтрально", () => {
    expect([tone(15, 20), tone(10, 10), tone(5, 5), tone(0, -10)]).toEqual(["good", "good", "neutral", "bad"]);
  });
});
