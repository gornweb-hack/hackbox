"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import type { Tone } from "@/lib/scales";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { type Phase, Scene, sceneAction } from "./scene/scenes";

// Сцена над текстом ситуации. У каждого сценария своя (scene/scenes.tsx), она меняется по ходу:
// после хорошего решения проводник подходит и протягивает руку, после плохого пассажиру хуже,
// в разборе показан исход. action — что сделал проводник в последнем ответе (поле action в YAML):
// рация, вода, объявление и т. п.; без него сцена реагирует по оценке решения. walkMs — сколько проводник катит тележку, пока человек читает
// (0 — сразу стоит); alarm — пульсирующая тревога, когда время на исходе; shakeKey — при каждой
// новой непустой строке вагон вздрагивает
export function CarScene({
  scenarioId,
  phase = "play",
  reaction,
  action,
  walkMs = 0,
  alarm = false,
  shakeKey,
}: {
  scenarioId?: string;
  phase?: Phase;
  reaction?: Tone;
  action?: string;
  walkMs?: number;
  alarm?: boolean;
  shakeKey?: string;
}) {
  const [arrived, setArrived] = useState(walkMs === 0);
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const clip = useId();

  useEffect(() => {
    if (!shakeKey || reduced) return;
    box.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "none" }],
      { duration: 450, easing: "ease-in-out" },
    );
  }, [shakeKey, reduced]);

  return (
    <div ref={box} className="relative overflow-hidden rounded-xl border bg-[#e9edf3]">
      <svg viewBox="0 74 400 144" role="img" aria-label="Сцена в вагоне поезда" className="block h-auto w-full">
        <Scene
          scenarioId={scenarioId}
          phase={phase}
          reaction={reaction}
          action={phase === "play" ? sceneAction(action) : undefined}
          clip={clip}
          bob={arrived ? undefined : "motion-safe:animate-car-bob"}
          walk={{
            className: walkMs ? "motion-safe:animate-car-walk" : undefined,
            style: { "--walk-ms": `${walkMs}ms` } as CSSProperties,
            onAnimationEnd: (event) => event.target === event.currentTarget && setArrived(true),
          }}
        />
      </svg>
      {alarm && (
        <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_48px_8px_var(--destructive)] motion-safe:animate-pulse" />
      )}
    </div>
  );
}
