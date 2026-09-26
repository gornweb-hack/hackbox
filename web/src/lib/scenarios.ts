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
