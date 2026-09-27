"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Role } from "./auth";

export interface User {
  id: string;
  login: string;
  name: string;
  email: string | null;
  role: Role;
  crew: string | null;
  depot: string | null;
  createdAt: string;
}

// Список перечитывается и по событиям user.* (lib/events.tsx): сотрудника изменили в другой вкладке
export const USERS_KEY = ["users"] as const;

export function useUsers() {
  return useQuery({ queryKey: USERS_KEY, queryFn: () => api<{ items: User[]; total: number }>("/api/users") });
}

// Без id — создание сотрудника, с id — правка
export function useSaveUser(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, string>) =>
      id === null ? api<User>("/api/users", { method: "POST", body }) : api<User>(`/api/users/${id}`, { method: "PATCH", body }),
    // Без await: диалог закрывается сразу, список догружается следом
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
