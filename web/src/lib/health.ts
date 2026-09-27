"use client";

import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api";

export const HEALTH_KEY = ["health"] as const;

export interface Health {
  core: "up" | "down";
  db: "up" | "down";
  redis: "up" | "down";
}

// Здоровье ядра, базы и Redis. 503 от ядра — это «база лежит», а не ошибка запроса
export function useHealth() {
  return useQuery({
    queryKey: HEALTH_KEY,
    refetchInterval: 10_000,
    retry: false,
    queryFn: async (): Promise<Health> => {
      try {
        const health = await api<{ db: "up"; redis: "up" | "down" }>("/api/health");
        return { core: "up", db: health.db, redis: health.redis };
      } catch (error) {
        if (error instanceof ApiError && error.code === "DB_UNAVAILABLE") return { core: "up", db: "down", redis: "down" };
        return { core: "down", db: "down", redis: "down" };
      }
    },
  });
}
