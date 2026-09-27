"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { type Outcome, OUTCOME_TITLES, type RunView } from "@/lib/runs";
import { formatDelta, type Tone } from "@/lib/scales";
import { useCountUp } from "@/lib/use-count-up";
import { CarScene } from "./car-scene";
import { RunReward } from "./reward-card";
import { ScaleMeter } from "./scale-meter";
import { ScreenFlash } from "./screen-flash";

// Исход вспыхивает на экране: хороший — зелёным, плохой — красным, «с замечаниями» — без вспышки
const OUTCOME_TONES: Record<Outcome, Tone> = { good: "good", ok: "neutral", bad: "bad" };

// Разбор после финала: исход, итоговые шкалы и каждое решение с тем, что и почему повлияло на шкалы
export function RunReport({ run }: { run: RunView }) {
  // Итоговые шкалы набегают от нуля, решения появляются по одному — разбор читается сверху вниз
  const loyalty = useCountUp(run.loyalty);
  const safety = useCountUp(run.safety);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {run.outcome && <ScreenFlash tone={OUTCOME_TONES[run.outcome]} />}
      {run.outcome && <CarScene scenarioId={run.scenarioId} phase={run.outcome} />}

      {/* Итог — единственное тёмное стекло на экране разбора */}
      <section className="glass-dark relative flex flex-col gap-3 rounded-2xl px-[22px] pt-6 pb-[22px]">
        <span className="text-[13px] font-medium text-[#93b2ff]">Разбор · {run.title}</span>
        <h1 className="text-[26px] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-white lg:text-[34px]">
          {run.outcome ? OUTCOME_TITLES[run.outcome] : "Прохождение завершено"}
        </h1>
        {run.finalText && <p className="text-[15px] leading-[1.45] text-pretty text-[#b9c0cc]">{run.finalText}</p>}
      </section>

      <section className="glass relative grid gap-5 rounded-xl p-5 sm:grid-cols-2 sm:gap-8">
        <ScaleMeter scale="loyalty" value={loyalty} />
        <ScaleMeter scale="safety" value={safety} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Ваши решения</h2>
        <ol className="flex flex-col gap-3">
          {run.decisions?.map((decision, index) => (
            <li
              key={index}
              style={{ animationDelay: `${300 + index * 120}ms` }}
              className="glass relative flex flex-col gap-3 rounded-xl p-5 fill-mode-both motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              <p className="text-[13px] text-muted-foreground">{decision.prompt}</p>
              <p className="text-[15px] font-medium">{decision.timedOut ? "Время вышло" : decision.answer}</p>
              <div className="flex flex-wrap gap-1.5">
                <DeltaBadge label="Лояльность" value={decision.loyaltyDelta} />
                <DeltaBadge label="Безопасность" value={decision.safetyDelta} />
              </div>
              <p className="glass-inner rounded-[20px] px-4 py-3 text-sm leading-[1.45]">
                <span className="font-semibold text-primary-text">Разбор. </span>
                {decision.review}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <RunReward runId={run.id} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`/scenarios/${run.scenarioId}`} className={buttonVariants({ size: "lg" })}>
          Пройти ещё раз
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          На главную
        </Link>
      </div>
    </div>
  );
}

function DeltaBadge({ label, value }: { label: string; value: number }) {
  return (
    <Badge variant="outline" className="glass-inner h-7 gap-1 px-2.5 text-[13px] font-medium text-muted-foreground">
      {label}
      <span className="font-semibold text-foreground">{formatDelta(value)}</span>
    </Badge>
  );
}
