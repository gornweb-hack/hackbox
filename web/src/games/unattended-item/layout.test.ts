import { describe, expect, it } from "vitest";
import { AISLE_X, makeCar, ROW_STEP, ROW_Y0, ROWS } from "./layout";

// Детерминированный генератор, чтобы проверять много разных расстановок одинаково при каждом запуске
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2 ** 31;
    return value / 2 ** 31;
  };
}

const cars = Array.from({ length: 200 }, (_, seed) => makeCar(seeded(seed + 1)));

describe("расстановка вагона", () => {
  it("находка не в последних трёх рядах, игрушка — в проходе", () => {
    for (const car of cars) {
      const row = car.kind === "toy" ? (car.item.y - 30 - ROW_Y0) / ROW_STEP : (car.item.y - ROW_Y0) / ROW_STEP;
      expect(row).toBeLessThan(ROWS - 3);
      if (car.kind === "toy") expect(Math.abs(car.item.x - AISLE_X)).toBeLessThanOrEqual(25);
    }
  });

  it("у каждой сумки-отвлечения рядом сидит владелец, на месте находки никого нет", () => {
    for (const car of cars) {
      expect(car.bags).toHaveLength(4);
      for (const bag of car.bags) {
        expect(car.passengers).toContain(bag.owner);
        expect(bag.owner.seat.y).toBe(bag.seat.y);
      }
      expect(car.passengers.some((p) => p.seat.x === car.item.x && p.seat.y === car.item.y)).toBe(false);
    }
  });

  it("выпадают все четыре находки, «сам вынесу» — только у тех, что можно унести", () => {
    expect(new Set(cars.map((car) => car.kind))).toEqual(new Set(["bag", "backpack", "smoke", "toy"]));
    for (const car of cars) if (car.plannedEvent === "grab") expect(["bag", "smoke"]).toContain(car.kind);
  });
});
