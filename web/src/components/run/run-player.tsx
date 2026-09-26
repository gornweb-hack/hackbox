"use client";

import { useQueryClient } from "@tanstack/react-query";
import { TimerOffIcon } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { runKey, type RunView, useChoose } from "@/lib/runs";
import { ScaleMeter } from "./scale-meter";
import { TimerBar } from "./timer-bar";

// Экран разошёлся с сервером: решение уже принято (двойной клик, вторая вкладка), время ещё не вышло,
// сценарий поправили. Молча перечитываем прохождение — страница покажет актуальный узел или сообщение
const RESYNC = new Set(["RUN_CONFLICT", "RUN_FINISHED", "CHOICE_NOT_FOUND", "TIMER_NOT_EXPIRED", "SCENARIO_CHANGED"]);

// Прохождение: две шкалы, ситуация, таймер и варианты ответа
export function RunPlayer({ run }: { run: RunView }) {
  const queryClient = useQueryClient();
  const choose = useChoose(run.id);
  const node = run.node;
  if (!node) return null;

  // Без choiceId — «время вышло». Пока запрос в пути, второй не отправляем
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">{run.title}</h1>

      <section className="grid gap-5 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2 sm:gap-8">
        <ScaleMeter scale="loyalty" value={run.loyalty} delta={run.last?.loyaltyDelta} />
        <ScaleMeter scale="safety" value={run.safety} delta={run.last?.safetyDelta} />
      </section>

      {run.last?.timedOut && (
        <p className="flex items-center gap-2.5 rounded-lg border bg-card px-3.5 py-3 text-sm">
          <TimerOffIcon className="size-[18px] shrink-0 text-primary-text" />
          Время вышло — ситуация развивалась без вас
        </p>
      )}

      <section className="rounded-xl bg-hero px-5 py-[22px]">
        <p className="text-[17px] leading-[1.5] text-pretty text-white">{node.text}</p>
      </section>

      {node.timer && (
        <TimerBar
          key={`${node.id}:${node.timer.remainingMs}`}
          seconds={node.timer.seconds}
          remainingMs={node.timer.remainingMs}
          onExpire={() => decide()}
        />
      )}

      <div className="flex flex-col gap-2">
        {node.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={choose.isPending}
            onClick={() => decide(choice.id)}
            className="min-h-11 rounded-lg border bg-card px-4 py-3 text-left text-[15px] leading-snug shadow-card transition-colors outline-none hover:border-primary-soft-border hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[.995] disabled:opacity-60"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
