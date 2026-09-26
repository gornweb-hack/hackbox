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
}

// Перечитывается по событию progress.updated (lib/events.tsx): геймификация обработала прохождение
export const PROGRESS_KEY = ["gamification", "progress"] as const;

export function useProgress() {
  return useQuery({ queryKey: PROGRESS_KEY, queryFn: () => api<Progress>("/api/gamification/me/progress") });
}

// «1 360» — пробел между разрядами, как в макете
export const formatXp = (xp: number) => xp.toLocaleString("ru-RU");
