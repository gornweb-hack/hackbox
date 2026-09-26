"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { SCENARIOS_KEY } from "./scenarios";

export type Outcome = "good" | "ok" | "bad";

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
  last?: { answer: string; timedOut: boolean; loyaltyDelta: number; safetyDelta: number };
  outcome?: Outcome;
  finalText?: string;
  decisions?: Decision[];
}

export const runKey = (runId: string) => ["runs", runId] as const;

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
      // Главная и каталог должны увидеть, что сценарий пройден
      if (run.status === "finished") void queryClient.invalidateQueries({ queryKey: SCENARIOS_KEY });
    },
  });
}
