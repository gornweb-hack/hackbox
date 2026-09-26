import { describe, expect, it } from "vitest";
import { formatDelta, zoneOf } from "./scales";

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
