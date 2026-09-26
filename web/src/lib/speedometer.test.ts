import { describe, expect, it } from "vitest";
import { arcPath, pointAt, tickPath } from "./speedometer";

describe("спидометр", () => {
  it("200 км/ч — стрелка вертикально вверх, 0 и 400 — симметрично внизу", () => {
    const [x, y] = pointAt(200, 120);
    expect([Math.round(x), Math.round(y)]).toEqual([150, 28]);
    const [x0, y0] = pointAt(0, 120);
    const [x400, y400] = pointAt(400, 120);
    expect(Math.round(x0 + x400)).toBe(300);
    expect(y0).toBeCloseTo(y400);
  });

  it("вся шкала — большая дуга, половина — малая", () => {
    expect(arcPath(0, 400)).toContain(" 0 1 1 ");
    expect(arcPath(0, 200)).toContain(" 0 0 1 ");
  });

  it("слишком короткая дуга не рисуется", () => {
    expect(arcPath(200, 200.1)).toBe("");
  });

  it("засечка — отрезок по радиусу", () => {
    expect(tickPath(200, 104, 114)).toBe("M150.00 44.00L150.00 34.00");
  });
});
