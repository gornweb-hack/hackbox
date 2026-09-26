import type { JournalRun } from './progress.js';
import type { Achievement, RunCondition } from './rules.js';

// Прохождение из журнала с тем, что нужно ачивкам
export interface AchievementRun extends JournalRun {
  runId: string;
  category: string;
  timeouts: number;
  timedDecisions: number;
}

export interface EarnedAchievement {
  achievement: Achievement;
  // Прохождение, на котором условие выполнилось впервые
  run: AchievementRun;
}

export interface AchievementProgress {
  // Доля пути 0–1; null — у ачивки нет промежуточного прогресса («категория на отлично»)
  share: number | null;
  text: string | null;
}

const plural = new Intl.PluralRules('ru-RU');
// «из 1 прохождения», «из 10 прохождений»: после «из N» — родительный падеж по числу N
const ofCount = (total: number, one: string, many: string) => `${total} ${plural.select(total) === 'one' ? one : many}`;

const chronological = (runs: AchievementRun[]) => [...runs].sort((a, b) => a.finishedAt.getTime() - b.finishedAt.getTime());

function matches(run: AchievementRun, condition: RunCondition): boolean {
  return (
    (condition.category === undefined || run.category === condition.category) &&
    (condition.outcome === undefined || run.outcome === condition.outcome) &&
    (condition.minLoyalty === undefined || run.loyalty >= condition.minLoyalty) &&
    (condition.minSafety === undefined || run.safety >= condition.minSafety) &&
    (!condition.noTimeouts || (run.timedDecisions > 0 && run.timeouts === 0))
  );
}

// Прохождение, после которого ачивка получена, или null. Прохождения — по времени, от старых к новым
function earnedOn(achievement: Achievement, ordered: AchievementRun[]): AchievementRun | null {
  const rule = achievement.when;
  if ('runs' in rule) return ordered[rule.runs - 1] ?? null;
  if ('categories' in rule) {
    const seen = new Set<string>();
    for (const run of ordered) {
      if (run.category) seen.add(run.category);
      if (seen.size >= rule.categories) return run;
    }
    return null;
  }
  return ordered.find((run) => matches(run, rule.run)) ?? null;
}

// Полученные ачивки считаются из журнала при каждом запросе, как опыт: правка правил пересчитывает всех
export function earned(runs: AchievementRun[], achievements: Achievement[]): EarnedAchievement[] {
  const ordered = chronological(runs);
  return achievements.flatMap((achievement) => {
    const run = earnedOn(achievement, ordered);
    return run ? [{ achievement, run }] : [];
  });
}

// Ачивки, которые принесло именно это прохождение
export function achievementsOfRun(runId: string, runs: AchievementRun[], achievements: Achievement[]): Achievement[] {
  return earned(runs, achievements)
    .filter((item) => item.run.runId === runId)
    .map((item) => item.achievement);
}

// Сколько осталось до ещё не полученной ачивки — для плитки «Следующая» на главной
export function progressOf(achievement: Achievement, runs: AchievementRun[]): AchievementProgress {
  const rule = achievement.when;
  if ('runs' in rule) {
    return { share: Math.min(1, runs.length / rule.runs), text: `${runs.length} из ${ofCount(rule.runs, 'прохождения', 'прохождений')}` };
  }
  if ('categories' in rule) {
    const seen = new Set(runs.map((run) => run.category).filter(Boolean)).size;
    return { share: Math.min(1, seen / rule.categories), text: `${seen} из ${ofCount(rule.categories, 'категории', 'категорий')}` };
  }
  const condition = rule.run;
  if (condition.noTimeouts) {
    const timed = runs.filter((run) => run.timedDecisions > 0);
    if (timed.length === 0) return { share: 0, text: 'Пока не было прохождений с таймером' };
    const best = timed.reduce((top, run) =>
      (run.timedDecisions - run.timeouts) / run.timedDecisions > (top.timedDecisions - top.timeouts) / top.timedDecisions ? run : top,
    );
    const inTime = best.timedDecisions - best.timeouts;
    return {
      share: inTime / best.timedDecisions,
      text: `Лучшая попытка: ${inTime} из ${ofCount(best.timedDecisions, 'решения', 'решений')} вовремя`,
    };
  }
  const scale = condition.minSafety !== undefined ? 'safety' : condition.minLoyalty !== undefined ? 'loyalty' : null;
  const target = scale === 'safety' ? condition.minSafety : condition.minLoyalty;
  if (scale && target !== undefined) {
    const best = Math.max(0, ...runs.map((run) => run[scale]));
    return { share: Math.min(1, best / target), text: `Лучший результат: ${best} из ${target}` };
  }
  return { share: null, text: null };
}
