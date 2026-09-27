import { describe, expect, it } from "vitest";
import type { Level, Progress } from "./gamification";
import { unlocksOf } from "./unlocks";

const LEVELS: Level[] = [
  { speed: 60, title: "Стажёр", xp: 0 },
  { speed: 120, title: "Проводник", xp: 300 },
  { speed: 200, title: "Старший проводник", xp: 800 },
];
const progress = (xp: number, lastRunXp: number | null) =>
  ({ xp, lastRunXp, level: LEVELS.findLast((level) => xp >= level.xp), levels: LEVELS }) as Progress;
const badge = { id: "first-trip", title: "Первый рейс", description: "" };

describe("unlocksOf", () => {
  it("прохождение перевело через порог — сначала уровень, потом ачивки", () => {
    const unlocks = unlocksOf({ xp: 150, achievements: [badge] }, progress(350, 150));
    expect(unlocks.map((unlock) => (unlock.kind === "level" ? unlock.level.title : unlock.achievement.id))).toEqual(["Проводник", "first-trip"]);
  });

  it("порог не перешли — только ачивки", () => {
    expect(unlocksOf({ xp: 100, achievements: [] }, progress(250, 100))).toEqual([]);
  });

  it("старое прохождение (опыт не совпадает с последним) — уровень не празднуем", () => {
    expect(unlocksOf({ xp: 150, achievements: [] }, progress(350, 90))).toEqual([]);
  });
});
