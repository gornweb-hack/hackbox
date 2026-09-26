"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { ANALYTICS_KEY } from "./analytics";
import { refreshSession } from "./api";
import { GAMIFICATION_KEY } from "./gamification";

// Событие из SSE /api/stream — конверт события (docs/events.md)
interface AppEvent {
  id?: string;
  type: string;
  source?: string;
  time?: string;
  userId?: string;
  broadcast?: boolean;
  data: unknown;
}

interface Notification {
  title?: string;
  message?: string;
  level?: "info" | "success" | "warning";
}

// Одно подключение к /api/stream на всё приложение.
// Уведомления → тосты, user.* → перечитать сотрудников, progress.updated → перечитать прогресс и награду,
// scenario.completed → перечитать навыки.
// При обрыве: закрыть, обновить сессию и переподключиться с паузой 1…10 с
export function EventStreamProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let stopped = false;

    const handle = (event: AppEvent) => {
      if (event.type === "notification.requested") {
        const { title, message, level } = event.data as Notification;
        const show = level === "success" ? toast.success : level === "warning" ? toast.warning : toast.info;
        show(title ?? "Уведомление", { description: message });
      } else if (event.type.startsWith("user.")) {
        void queryClient.invalidateQueries({ queryKey: ["users"] });
      } else if (event.type === "progress.updated") {
        void queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEY });
      } else if (event.type === "scenario.completed") {
        void queryClient.invalidateQueries({ queryKey: ANALYTICS_KEY });
      }
    };

    const connect = () => {
      source = new EventSource("/api/stream");
      source.onopen = () => {
        attempt = 0;
      };
      source.onmessage = (message) => {
        try {
          handle(JSON.parse(message.data) as AppEvent);
        } catch {
          // Не-JSON сообщения (например, служебные) пропускаем
        }
      };
      // EventSource не показывает статус ответа: при любой ошибке обновляем сессию
      // (вдруг истёк access-токен) и переподключаемся сами
      source.onerror = () => {
        source?.close();
        if (stopped) return;
        const delay = Math.min(1_000 * 2 ** attempt, 10_000);
        attempt += 1;
        retryTimer = setTimeout(() => {
          void refreshSession().finally(() => {
            if (!stopped) connect();
          });
        }, delay);
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      source?.close();
    };
  }, [queryClient]);

  return children;
}
