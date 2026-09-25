"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type Role = "USER" | "MANAGER" | "ADMIN";

export interface Me {
  id: string;
  login: string;
  name: string;
  email: string | null;
  role: Role;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Сотрудник",
  MANAGER: "Руководитель",
  ADMIN: "Администратор",
};

export const ME_KEY = ["me"] as const;

// Текущий пользователь. Без входа api() сам отправит на /login
export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: () => api<Me>("/api/auth/me"), staleTime: 60_000 });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    queryClient.clear();
    // Полная перезагрузка: закрыть SSE и не оставить в памяти данные прежнего пользователя
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  };
}
