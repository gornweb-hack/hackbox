"use client";

import { useQueryClient } from "@tanstack/react-query";
import { TimerOffIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { runKey, type RunView, useChoose } from "@/lib/runs";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { CarScene } from "./car-scene";
import { ScaleMeter } from "./scale-meter";
import { TimerBar } from "./timer-bar";
import { TypedText } from "./typed-text";

// Экран разошёлся с сервером: решение уже принято (двойной клик, вторая вкладка), время ещё не вышло,
// сценарий поправили. Молча перечитываем прохождение — страница покажет актуальный узел или сообщение
const RESYNC = new Set(["RUN_CONFLICT", "RUN_FINISHED", "CHOICE_NOT_FOUND", "TIMER_NOT_EXPIRED", "SCENARIO_CHANGED"]);

// Опасное решение — безопасность упала на столько или сильнее: вагон вздрагивает
const SHAKE_SAFETY_DELTA = -15;

// Прохождение: сцена вагона, две шкалы, ситуация, таймер и варианты ответа
export function RunPlayer({ run }: { run: RunView }) {
  const queryClient = useQueryClient();
  const choose = useChoose(run.id);
  const reduced = useReducedMotion();
  // Узел, текст которого уже напечатан, и узел, где время на исходе. Храним id узла, а не флаг,
  // чтобы на следующем узле состояние сбросилось само
  const [typedNode, setTypedNode] = useState<string>();
  const [urgentNode, setUrgentNode] = useState<string>();
  const nodeId = run.node?.id;
  const onTyped = useCallback(() => setTypedNode(nodeId), [nodeId]);
  const node = run.node;
  if (!node) return null;

  // С таймером текст показываем сразу: серверное время уже идёт, печать отняла бы его
  const instant = Boolean(node.timer) || reduced;
  const ready = instant || typedNode === node.id;
  const shaken = run.last !== undefined && run.last.safetyDelta <= SHAKE_SAFETY_DELTA;

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

      <CarScene walkMs={3500} alarm={urgentNode === node.id} shakeKey={shaken ? node.id : undefined} />

      <section className="grid gap-5 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2 sm:gap-8">
        <ScaleMeter scale="loyalty" value={run.loyalty} delta={run.last?.loyaltyDelta} />
        <ScaleMeter scale="safety" value={run.safety} delta={run.last?.safetyDelta} />
      </section>

      {run.last?.timedOut && (
        <p className="flex items-center gap-2.5 rounded-lg border bg-card px-3.5 py-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
          <TimerOffIcon className="size-[18px] shrink-0 text-primary-text" />
          Время вышло — ситуация развивалась без вас
        </p>
      )}

      <section className="rounded-xl bg-hero px-5 py-[22px]">
        <TypedText key={node.id} text={node.text} instant={instant} onDone={onTyped} />
      </section>

      {node.timer && (
        <TimerBar
          key={`${node.id}:${node.timer.remainingMs}`}
          seconds={node.timer.seconds}
          remainingMs={node.timer.remainingMs}
          onExpire={() => decide()}
          onUrgent={() => setUrgentNode(node.id)}
        />
      )}

      {/* Варианты появляются по одному, когда ситуация дочитана */}
      <div className="flex flex-col gap-2">
        {ready && node.choices.map((choice, index) => (
          <button
            key={`${node.id}:${choice.id}`}
            type="button"
            disabled={choose.isPending}
            onClick={() => decide(choice.id)}
            style={{ animationDelay: `${index * 90}ms` }}
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 fill-mode-both min-h-11 rounded-lg border bg-card px-4 py-3 text-left text-[15px] leading-snug shadow-card transition-colors outline-none hover:border-primary-soft-border hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[.995] disabled:opacity-60"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
