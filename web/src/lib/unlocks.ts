import type { Achievement, Level, Progress, Reward } from "./gamification";

// Что праздновать после прохождения: новый уровень (первым) и новые ачивки — по очереди, по центру экрана

export type Unlock = { kind: "level"; level: Level } | { kind: "achievement"; achievement: Achievement };

// Уровень, до которого хватает опыта
function levelAt(levels: Level[], xp: number): Level | undefined {
  return levels.findLast((level) => xp >= level.xp);
}

// Новый уровень считается по опыту до и после прохождения. Это верно только для последнего прохождения
// (у него опыт совпадает с lastRunXp): для старых «опыт до» из текущего не восстановить
export function unlocksOf(reward: Reward, progress: Progress | undefined): Unlock[] {
  const unlocks: Unlock[] = [];
  if (progress && progress.lastRunXp === reward.xp) {
    const before = levelAt(progress.levels, progress.xp - reward.xp);
    if (before && before.speed < progress.level.speed) unlocks.push({ kind: "level", level: progress.level });
  }
  for (const achievement of reward.achievements) unlocks.push({ kind: "achievement", achievement });
  return unlocks;
}
