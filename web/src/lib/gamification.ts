"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface Level {
  // Скорость на спидометре, км/ч
  speed: number;
  title: string;
  // Сколько опыта нужно для уровня
  xp: number;
}

export interface ScaleAverage {
  value: number;
  // null — неделю назад прохождений ещё не было
  weekDelta: number | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

// Ачивки на главной: сколько получено, последняя и следующая с прогрессом
export interface AchievementsSummary {
  earned: number;
  total: number;
  // isNew — получена последним прохождением
  latest: (Achievement & { isNew: boolean }) | null;
  // share — доля пути 0–1; null — у ачивки нет промежуточного прогресса
  next: (Achievement & { share: number | null; text: string | null }) | null;
}

// Прогресс из ядра (GET /api/gamification/me/progress). Правила — в content/gamification.yaml
export interface Progress {
  xp: number;
  lastRunXp: number | null;
  level: Level;
  next: Level | null;
  // Доля пути от текущего уровня к следующему, 0–1
  progress: number;
  levels: Level[];
  reputation: { loyalty: ScaleAverage; safety: ScaleAverage; runs: number } | null;
  achievements: AchievementsSummary;
}

// Награда за одно прохождение (GET /api/gamification/runs/:runId/reward) — для разбора
export interface Reward {
  xp: number;
  achievements: Achievement[];
}

// Всё из геймификации перечитывается по событию progress.updated (lib/events.tsx):
// модуль записал прохождение, значит изменились и прогресс, и награда
export const GAMIFICATION_KEY = ["gamification"] as const;

export function useProgress() {
  return useQuery({
    queryKey: [...GAMIFICATION_KEY, "progress"],
    queryFn: () => api<Progress>("/api/gamification/me/progress"),
  });
}

// Пока событие о прохождении не обработано, ядро отвечает 404 REWARD_PENDING; повторять не нужно —
// запрос перечитается сам по progress.updated
export function useReward(runId: string) {
  return useQuery({
    queryKey: [...GAMIFICATION_KEY, "reward", runId],
    queryFn: () => api<Reward>(`/api/gamification/runs/${runId}/reward`),
  });
}

// «1 360» — пробел между разрядами, как в макете
export const formatXp = (xp: number) => xp.toLocaleString("ru-RU");
