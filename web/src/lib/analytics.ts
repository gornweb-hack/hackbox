"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface SkillScore {
  id: string;
  title: string;
  // Процент верных решений 0–100; null — навык ещё не проверялся
  value: number | null;
  hits: number;
  tests: number;
}

// Навыки из ядра (GET /api/analytics/me/skills). Правила — в content/skills.yaml
export interface Skills {
  skills: SkillScore[];
  runs: number;
  // null — навыки ещё не проверялись или все проверенные на 100%
  weakest: string | null;
  recommendation: { scenarioId: string } | null;
}

// Что потренировать: слабый навык и сценарий, где он проверяется чаще всего
export interface Training {
  scenarioId: string;
  skill: SkillScore;
}

// Перечитывается по scenario.completed (lib/events.tsx): решения прохождения уже в базе
export const ANALYTICS_KEY = ["analytics"] as const;

export function useSkills() {
  return useQuery({ queryKey: [...ANALYTICS_KEY, "skills"], queryFn: () => api<Skills>("/api/analytics/me/skills") });
}

// Проверялся ли хоть один навык: до первого прохождения радар — заглушка
export const anyTested = (skills: Skills) => skills.skills.some((skill) => skill.value !== null);

export function trainingOf(skills: Skills | undefined): Training | null {
  const skill = skills?.skills.find((item) => item.id === skills.weakest);
  return skills?.recommendation && skill ? { scenarioId: skills.recommendation.scenarioId, skill } : null;
}
