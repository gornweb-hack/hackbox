"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type CarClass = "Стандарт" | "Комфорт" | "Бизнес" | "Первый";

// Сценарий из каталога ядра (GET /api/scenarios), описание — в content/scenarios/<id>.yaml
export interface Scenario {
  id: string;
  title: string;
  summary: string;
  category: { id: string; title: string };
  carClass: CarClass;
  durationMin: number;
  order: number;
  isNew: boolean;
  // Хотя бы одно решение — на время
  hasTimers: boolean;
  // Вошедший хоть раз дошёл до финала
  completed: boolean;
}

export const SCENARIOS_KEY = ["scenarios"] as const;

// Каталог по порядку: первым идёт сценарий, с которого начинает новичок
export function useScenarios() {
  return useQuery({
    queryKey: SCENARIOS_KEY,
    queryFn: () => api<{ items: Scenario[]; total: number }>("/api/scenarios"),
    select: (data) => data.items,
  });
}

// «Комфорт-класс», как в макете; у Первого класса дефис не ставится
export function classLabel(carClass: CarClass) {
  return carClass === "Первый" ? "Первый класс" : `${carClass}-класс`;
}

export interface CategoryGroup {
  id: string;
  title: string;
  items: Scenario[];
}

// Сценарии по категориям. Категории идут в порядке первого сценария в них
export function groupByCategory(scenarios: Scenario[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const scenario of scenarios) {
    const group = groups.get(scenario.category.id) ?? { ...scenario.category, items: [] };
    group.items.push(scenario);
    groups.set(scenario.category.id, group);
  }
  return [...groups.values()];
}

// Что предложить на главной: первый сценарий новичку, следующий непройденный или весь каталог
export type HeroState =
  | { kind: "first"; scenario: Scenario }
  | { kind: "next"; scenario: Scenario }
  | { kind: "done" };

export function heroState(scenarios: Scenario[]): HeroState | null {
  if (scenarios.length === 0) return null;
  if (!scenarios.some((scenario) => scenario.completed)) return { kind: "first", scenario: scenarios[0] };
  const next = scenarios.find((scenario) => !scenario.completed);
  return next ? { kind: "next", scenario: next } : { kind: "done" };
}
