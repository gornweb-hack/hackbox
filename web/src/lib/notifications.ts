"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  level: "info" | "success" | "warning";
  createdAt: string;
  // null — ещё не прочитано
  readAt: string | null;
}

export interface NotificationList {
  items: AppNotification[];
  total: number;
  unread: number;
}

// Список перечитывается по событию notifications.updated (lib/events.tsx): ядро сохранило
// новое уведомление или отметило прочитанными в другой вкладке
export const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotifications() {
  return useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: () => api<NotificationList>("/api/notifications") });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ unread: number }>("/api/notifications/read", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

const dayTime = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });

// «только что», «5 мин назад», «3 ч назад», старше суток — дата и время по Москве
export function timeAgo(iso: string, now: number = Date.now()) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} ч назад`;
  return dayTime.format(new Date(iso));
}
