"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { runKey, type RunView, useChoose } from "@/lib/runs";

// Экран разошёлся с сервером: решение уже принято (двойной клик, вторая вкладка), время ещё не вышло,
// сценарий поправили. Молча перечитываем прохождение — страница покажет актуальный узел или сообщение
const RESYNC = new Set(["RUN_CONFLICT", "RUN_FINISHED", "CHOICE_NOT_FOUND", "TIMER_NOT_EXPIRED", "SCENARIO_CHANGED"]);

// Решение в текущем узле, общее для обоих плееров. Без choiceId — «время вышло».
// Пока запрос в пути, второй не отправляем
export function useDecide(run: RunView) {
  const queryClient = useQueryClient();
  const choose = useChoose(run.id);

  const decide = (choiceId?: string) => {
    if (choose.isPending) return;
    choose.mutate(choiceId, {
      onError: (error) => {
        if (error instanceof ApiError && RESYNC.has(error.code)) {
          void queryClient.invalidateQueries({ queryKey: runKey(run.id) });
        } else {
          toast.error(error.message);
        }
      },
    });
  };

  return { decide, pending: choose.isPending };
}
