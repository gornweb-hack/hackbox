// Статичные данные шапки, пока у ядра нет бригады, депо и хранилища уведомлений.
// Компоненты получают их пропсами: когда появятся эндпоинты, этот файл заменяется запросами, вёрстка не меняется

export interface ProfileSummary {
  /** Бригада и депо */
  crew: string;
  /** Непрочитанные уведомления */
  unread: number;
}

export const DEMO_PROFILE: ProfileSummary = {
  crew: "Бригада 3 · Депо Москва-ВСМ",
  unread: 1,
};

export interface RunReward {
  xp: number;
  achievements: { id: string; title: string; description: string }[];
}

const OUTCOME_XP = { good: 150, ok: 100, bad: 50 } as const;

// Награда в разборе, пока gamification не отдаёт её по API. Правила условные, для показа блока:
// опыт — за исход и за среднее двух шкал, минус 30 за каждый таймаут; ачивки — за решения без
// таймаутов и за высокие шкалы. Настоящие правила считает бэкенд gamification
export function demoReward(
  run: { outcome?: "good" | "ok" | "bad"; loyalty: number; safety: number; decisions?: { timedOut: boolean }[] },
  hasTimers: boolean,
): RunReward {
  const timeouts = run.decisions?.filter((decision) => decision.timedOut).length ?? 0;
  const base = run.outcome ? OUTCOME_XP[run.outcome] : 0;
  const xp = Math.max(20, base + Math.round((run.loyalty + run.safety) / 4) - 30 * timeouts);

  const achievements: RunReward["achievements"] = [];
  if (hasTimers && timeouts === 0) {
    achievements.push({ id: "cold-head", title: "Холодная голова", description: "Все решения на время приняты вовремя" });
  }
  if (run.safety >= 80) {
    achievements.push({ id: "safety-first", title: "Безопасность прежде всего", description: "Рейтинг безопасности 80 и выше" });
  }
  if (run.loyalty >= 80) {
    achievements.push({ id: "passenger-voice", title: "Голос пассажира", description: "Лояльность пассажира 80 и выше" });
  }
  return { xp, achievements };
}
