"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { SCENARIOS_KEY } from "./scenarios";

export type Outcome = "good" | "ok" | "bad";

// Исход — в разборе и в истории профиля
export const OUTCOME_TITLES: Record<Outcome, string> = {
  good: "Отлично справились",
  ok: "Справились с замечаниями",
  bad: "Ситуация вышла из-под контроля",
};

export interface Decision {
  prompt: string;
  answer: string;
  timedOut: boolean;
  loyaltyDelta: number;
  safetyDelta: number;
  review: string;
}

// Прохождение из ядра (/api/scenarios/runs): текущий узел и шкалы, после финала — исход и разбор
export interface RunView {
  id: string;
  scenarioId: string;
  title: string;
  status: "active" | "finished";
  loyalty: number;
  safety: number;
  node?: {
    id: string;
    text: string;
    choices: { id: string; text: string }[];
    // remainingMs считает сервер: часы клиента не важны
    timer?: { seconds: number; remainingMs: number };
  };
  // action — что делает проводник в этом ответе (поле action варианта в YAML), по нему сцена
  // показывает свою анимацию; у ответа без action и при «время вышло» поля нет
  last?: { answer: string; timedOut: boolean; loyaltyDelta: number; safetyDelta: number; action?: string };
  outcome?: Outcome;
  finalText?: string;
  decisions?: Decision[];
}

// Строка истории в профиле (GET /api/scenarios/runs)
export interface RunSummary {
  id: string;
  scenarioId: string;
  // null — сценарий убрали из каталога
  title: string | null;
  outcome: Outcome;
  loyalty: number;
  safety: number;
  finishedAt: string;
}

export const runKey = (runId: string) => ["runs", runId] as const;
const HISTORY_KEY = ["runs", "history"] as const;

// Свои завершённые прохождения, новые первыми
export function useRunHistory() {
  return useQuery({ queryKey: HISTORY_KEY, queryFn: () => api<{ items: RunSummary[]; total: number }>("/api/scenarios/runs") });
}

export function useRun(runId: string) {
  return useQuery({ queryKey: runKey(runId), queryFn: () => api<RunView>(`/api/scenarios/runs/${runId}`) });
}

export function useStartRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioId: string) => api<RunView>("/api/scenarios/runs", { method: "POST", body: { scenarioId } }),
    onSuccess: (run) => queryClient.setQueryData(runKey(run.id), run),
  });
}

// Решение в текущем узле; без choiceId — «время вышло»
export function useChoose(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choiceId?: string) =>
      api<RunView>(`/api/scenarios/runs/${runId}/choices`, { method: "POST", body: choiceId ? { choiceId } : {} }),
    onSuccess: (run) => {
      queryClient.setQueryData(runKey(runId), run);
      // Главная, каталог и история в профиле должны увидеть, что сценарий пройден
      if (run.status === "finished") {
        void queryClient.invalidateQueries({ queryKey: SCENARIOS_KEY });
        void queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
      }
    },
  });
}
