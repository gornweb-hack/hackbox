"use client";

import { PlayIcon, TrainFrontIcon } from "lucide-react";
import Link from "next/link";
import { RouteMap } from "@/components/route/route-map";
import { ScenarioTags } from "@/components/scenario-tags";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatXp, type Progress, useProgress } from "@/lib/gamification";
import { nextStop } from "@/lib/route";
import { useRunHistory } from "@/lib/runs";
import { type Scenario, useScenarios } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

// Сценарии как рейс: уровни — станции, сценарии — остановки, опыт — поезд на линии (lib/route.ts).
// На телефоне сводка над схемой, на компьютере справа закреплены сводка и «Следующая остановка»
export default function ScenariosPage() {
  const scenarios = useScenarios();
  const progress = useProgress();
  const history = useRunHistory();
  // Схему рисуем, когда известны и сценарии, и опыт: иначе поезду неоткуда доехать
  const loading = scenarios.isPending || progress.isPending || history.isPending;
  const next = nextStop(scenarios.data ?? []);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Сценарии</h1>
          <p className="text-sm text-muted-foreground">
            Станции — уровни от 60 до 400 км/ч, остановки — сценарии. Опыт за прохождения везёт ваш поезд дальше.
          </p>
        </div>

        {progress.data && (
          <div className="lg:hidden">
            <TripSummary progress={progress.data} />
          </div>
        )}

        {loading ? (
          <div className="flex max-w-xl flex-col gap-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : scenarios.isError || progress.isError ? (
          <p className="text-sm text-muted-foreground">Маршрут недоступен. Обновите страницу чуть позже.</p>
        ) : scenarios.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Сценариев пока нет.</p>
        ) : (
          <div className="max-w-xl">
            <RouteMap levels={progress.data.levels} scenarios={scenarios.data} xp={progress.data.xp} history={history.data?.items ?? []} />
          </div>
        )}
      </div>

      <aside className="sticky top-6 hidden flex-col gap-3 lg:flex">
        {progress.data && <TripSummary progress={progress.data} />}
        {scenarios.data && <NextStop scenario={next} />}
      </aside>
    </div>
  );
}

// Сводка поездки: текущая станция и сколько осталось ехать до следующей
function TripSummary({ progress }: { progress: Progress }) {
  const { level, next, xp } = progress;
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-hero px-4 py-3.5 text-white">
      <div className="flex items-center gap-3">
        <TrainFrontIcon className="size-6 shrink-0 text-[#93b2ff]" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-semibold">
            <span className="font-mono text-amber tabular-nums">{level.speed} км/ч</span> · {level.title}
          </span>
          <span className="text-[13px] text-[#b9c0cc]">
            {next ? (
              <>
                Ещё <span className="font-mono font-semibold text-amber tabular-nums">{formatXp(Math.max(0, next.xp - xp))}</span> опыта до «
                {next.title}», {next.speed} км/ч
              </>
            ) : (
              "Вы на конечной: Мастер ВСМ"
            )}
          </span>
        </div>
      </div>
      {next && (
        <div
          role="progressbar"
          aria-label={`Путь до станции «${next.title}»`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.progress * 100)}
          className="h-1.5 overflow-hidden rounded-full bg-white/15"
        >
          <div className="h-full rounded-full bg-amber transition-[width] duration-700" style={{ width: `${progress.progress * 100}%` }} />
        </div>
      )}
    </section>
  );
}

// Действие справа на компьютере: следующая остановка и кнопка «Начать»
function NextStop({ scenario }: { scenario?: Scenario }) {
  if (!scenario) {
    return (
      <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground shadow-card">
        Все остановки пройдены. Вернитесь к сценариям со штампами «Вернуться» и «Зачтено» и улучшите результат.
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card">
      <span className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">Следующая остановка</span>
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-muted-foreground">{scenario.category.title}</span>
        <span className="text-base leading-snug font-semibold">{scenario.title}</span>
        <p className="text-sm text-muted-foreground">{scenario.summary}</p>
      </div>
      <ScenarioTags scenario={scenario} tone="light" withCategory={false} />
      <Link href={`/scenarios/${scenario.id}`} className={cn(buttonVariants(), "h-11 gap-2 text-[15px]")}>
        <PlayIcon className="size-4 fill-current" />
        Начать
      </Link>
    </section>
  );
}
