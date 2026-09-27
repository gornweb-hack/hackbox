"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunView } from "@/lib/runs";
import { decisionTone, type Tone } from "@/lib/scales";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import { ChoiceList } from "../choice-list";
import { LOOKS } from "../scene/head";
import { ScreenFlash } from "../screen-flash";
import { TimerBar } from "../timer-bar";
import { TypedText } from "../typed-text";
import { useDecide } from "../use-decide";
import { Backdrop } from "./backdrop";
import { Bust } from "./bust";
import { emotionOf, type Role, stageFor } from "./cast";

// Плеер в стиле визуальной новеллы: персонажи на сцене реагируют на решения, текст узла — в окне
// реплики с плашкой имени, ниже таймер и варианты. Шкалы здесь не показываем — их итог в разборе. Сверстан сначала под телефон: квадратная сцена,
// окно реплики наезжает на неё снизу, варианты сами докручиваются в поле зрения
export function NovelPlayer({ run }: { run: RunView }) {
  const { decide, pending } = useDecide(run);
  const reduced = useReducedMotion();
  // Как в обычном плеере: узел, текст которого напечатан, и узел, где время на исходе
  const [typedNode, setTypedNode] = useState<string>();
  const [urgentNode, setUrgentNode] = useState<string>();
  const stageBox = useRef<HTMLDivElement>(null);
  const choicesBox = useRef<HTMLDivElement>(null);
  const node = run.node;
  const nodeId = node?.id;
  const onTyped = useCallback(() => setTypedNode(nodeId), [nodeId]);
  const reaction = run.last ? decisionTone(run.last) : undefined;
  // С таймером текст показываем сразу: серверное время уже идёт, печать отняла бы его
  const instant = Boolean(node?.timer) || reduced;
  const ready = instant || typedNode === nodeId;

  // После плохого решения сцена вздрагивает
  useEffect(() => {
    if (reaction !== "bad" || reduced) return;
    stageBox.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(-4px)" }, { transform: "none" }],
      { duration: 450, easing: "ease-in-out" },
    );
  }, [nodeId, reaction, reduced]);

  // На телефоне варианты оказываются ниже края экрана — докручиваем к ним, когда они появились
  useEffect(() => {
    if (ready) choicesBox.current?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [ready, nodeId, reduced]);

  if (!node) return null;
  const stage = stageFor(run.scenarioId, node.id);
  const focus = stage?.[stage.focus];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <h1 className="text-[20px] leading-tight font-semibold tracking-[-0.02em] sm:text-[22px]">{run.title}</h1>

      {reaction && <ScreenFlash key={node.id} tone={reaction} />}

      <div ref={stageBox} className="relative aspect-square overflow-hidden rounded-2xl border sm:aspect-[16/9]">
        <Backdrop station={stage?.station} />
        {stage?.left && <Sprite side="left" role={stage.left} reaction={reaction} active={stage.focus === "left"} nodeId={node.id} />}
        {stage?.right && <Sprite side="right" role={stage.right} reaction={reaction} active={stage.focus === "right"} nodeId={node.id} />}
        {urgentNode === node.id && (
          <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_56px_10px_var(--destructive)] motion-safe:animate-pulse" />
        )}
      </div>

      {/* Окно реплики наезжает на сцену снизу, как в визуальных новеллах */}
      <section className="glass-dark relative z-10 mx-2 -mt-12 rounded-2xl px-5 pt-6 pb-5 sm:mx-6 sm:-mt-14">
        {focus && (
          <span className="absolute -top-3.5 left-4 z-1 rounded-full px-3 py-1 text-[13px] font-semibold text-white" style={{ background: focus.plate }}>
            {focus.name}
            <span className="ml-1.5 font-normal opacity-80">{focus.role}</span>
          </span>
        )}
        {run.last?.timedOut && <p className="mb-2 text-[13px] font-medium text-[#ff9d9d]">Время вышло — ситуация развивалась без вас</p>}
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

      <div ref={choicesBox} className="scroll-mb-24">
        {ready && <ChoiceList node={node} pending={pending} onChoose={decide} />}
      </div>
    </div>
  );
}

// Персонаж на сцене: в центре внимания — яркий и выезжает снизу на новом узле, собеседник притушен
function Sprite({ side, role, reaction, active, nodeId }: { side: "left" | "right"; role: Role; reaction?: Tone; active: boolean; nodeId: string }) {
  const emotion = emotionOf(role, reaction);
  return (
    <div
      className={cn(
        "absolute bottom-0 w-[52%] origin-bottom transition-[filter,transform] duration-500 sm:w-[34%]",
        side === "left" ? "-left-[2%] sm:left-[4%]" : "-right-[2%] sm:right-[4%]",
        !active && "scale-[.94] brightness-[.62] saturate-[.8]",
      )}
    >
      <div key={active ? nodeId : undefined} className={active ? "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4" : undefined}>
        <Bust look={LOOKS[role.look]} coat={role.coat} emotion={emotion} pale={role.paleWhenPain && emotion === "pain"} />
      </div>
    </div>
  );
}
