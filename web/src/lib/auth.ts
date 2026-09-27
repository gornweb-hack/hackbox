"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { SPLASH_SEEN_KEY } from "./loader-timeline";

export type Role = "USER" | "MANAGER" | "ADMIN";

export interface Me {
  id: string;
  login: string;
  name: string;
  email: string | null;
  role: Role;
  // Бригада и депо — для шапки и рейтинга; null, если не назначены
  crew: string | null;
  depot: string | null;
  // Портрет из набора (components/portrait.tsx); null — инициалы
  avatar: string | null;
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

// Смена своего портрета; null — вернуть инициалы. Ответ — обновлённый профиль, шапка меняется сразу
export function useSetAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (avatar: string | null) => api<Me>("/api/auth/me", { method: "PATCH", body: { avatar } }),
    onSuccess: (me) => queryClient.setQueryData(ME_KEY, me),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    queryClient.clear();
    // Следующий вход в этой вкладке снова покажет заставку
    try {
      sessionStorage.removeItem(SPLASH_SEEN_KEY);
    } catch {
      // Хранилище недоступно — отметки там и нет
    }
    // Полная перезагрузка: закрыть SSE и не оставить в памяти данные прежнего пользователя
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  };
}
