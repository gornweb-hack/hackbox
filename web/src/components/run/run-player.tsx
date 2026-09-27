"use client";

import { TimerOffIcon } from "lucide-react";
import { useCallback, useState } from "react";
import type { RunView } from "@/lib/runs";
import { decisionTone } from "@/lib/scales";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { CarScene } from "./car-scene";
import { ChoiceList } from "./choice-list";
import { ScaleMeter } from "./scale-meter";
import { ScreenFlash } from "./screen-flash";
import { TimerBar } from "./timer-bar";
import { TypedText } from "./typed-text";
import { useDecide } from "./use-decide";

// Прохождение: сцена вагона, две шкалы, ситуация, таймер и варианты ответа
export function RunPlayer({ run }: { run: RunView }) {
  const { decide, pending } = useDecide(run);
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
  // Реакция на прошлое решение: вспышка экрана, сцена и тряска вагона после плохого
  const reaction = run.last ? decisionTone(run.last) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">{run.title}</h1>

      {reaction && <ScreenFlash key={node.id} tone={reaction} />}

      <CarScene
        scenarioId={run.scenarioId}
        reaction={reaction}
        action={run.last?.action}
        walkMs={3500}
        alarm={urgentNode === node.id}
        shakeKey={reaction === "bad" ? node.id : undefined}
      />

      {/* Таймер сразу под сценой, чтобы его было видно вместе с ситуацией */}
      {node.timer && (
        <TimerBar
          key={`${node.id}:${node.timer.remainingMs}`}
          seconds={node.timer.seconds}
          remainingMs={node.timer.remainingMs}
          onExpire={() => decide()}
          onUrgent={() => setUrgentNode(node.id)}
        />
      )}

      <section className="glass relative grid gap-5 rounded-xl p-5 sm:grid-cols-2 sm:gap-8">
        <ScaleMeter scale="loyalty" value={run.loyalty} delta={run.last?.loyaltyDelta} />
        <ScaleMeter scale="safety" value={run.safety} delta={run.last?.safetyDelta} />
      </section>

      {run.last?.timedOut && (
        <p className="glass-inner flex items-center gap-2.5 rounded-[20px] px-4 py-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
          <TimerOffIcon className="size-[18px] shrink-0 text-primary-text" />
          Время вышло — ситуация развивалась без вас
        </p>
      )}

      <section className="glass-dark relative rounded-2xl px-[22px] py-6">
        <TypedText key={node.id} text={node.text} instant={instant} onDone={onTyped} />
      </section>

      {ready && <ChoiceList node={node} pending={pending} onChoose={decide} />}
    </div>
  );
}
