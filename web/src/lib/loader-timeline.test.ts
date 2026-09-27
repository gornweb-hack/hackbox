import { describe, expect, it } from "vitest";
import { CYCLE, LINES, lineX, loaderFrame, STILL_T } from "./loader-timeline";

describe("loaderFrame", () => {
  it("разгон с 0 до 400 км/ч между 0,3 и 2,0 с", () => {
    expect([0, 0.3, 1.15, 2.0].map((t) => loaderFrame(t).kmh)).toEqual([0, 0, 200, 400]);
  });

  it("до финала названия и кольца нет", () => {
    const frame = loaderFrame(1.5);
    expect([frame.word1, frame.word2, frame.caption, frame.ringOpacity, frame.shakeX]).toEqual([0, 0, 0, 0, 0]);
  });

  it("в итоговом кадре всё на месте и видно", () => {
    const frame = loaderFrame(STILL_T);
    expect([frame.kmh, frame.word1, frame.word2, frame.caption, frame.go, frame.tileScale]).toEqual([400, 1, 1, 1, 1, 1]);
  });

  it("к концу цикла всё гаснет", () => {
    expect(loaderFrame(CYCLE).go).toBe(0);
  });
});

describe("lineX", () => {
  const line = LINES[1]; // ширина 150, сдвиг 40, множитель 1

  it("в начале цикла линия стоит на стартовом сдвиге от правого края", () => {
    expect(lineX(line, 0, 390)).toBe(350);
  });

  it("ушедшая за левый край линия возвращается справа", () => {
    expect(lineX(line, 390 + 150 - 40, 390)).toBe(390);
  });
});
