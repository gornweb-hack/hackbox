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

// Сводка поездки: текущая станция и сколько осталось ехать до следующей. Светлое стекло: тёмное на экране — у действия
function TripSummary({ progress }: { progress: Progress }) {
  const { level, next, xp } = progress;
  return (
    <section className="glass relative flex flex-col gap-3 rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="glass-inner flex size-10 shrink-0 items-center justify-center rounded-md">
          <TrainFrontIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-semibold">
            {level.speed} км/ч · {level.title}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {next ? (
              <>
                Ещё <span className="font-semibold text-foreground">{formatXp(Math.max(0, next.xp - xp))}</span> опыта до «
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
          className="h-1.5 overflow-hidden rounded-full bg-track"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${progress.progress * 100}%` }} />
        </div>
      )}
    </section>
  );
}

// Действие справа на компьютере — тёмное стекло: следующая остановка и кнопка «Начать»
function NextStop({ scenario }: { scenario?: Scenario }) {
  if (!scenario) {
    return (
      <section className="rounded-[20px] border border-dashed border-border-strong p-4 text-sm text-muted-foreground">
        Все остановки пройдены. Вернитесь к сценариям со штампами «Вернуться» и «Зачтено» и улучшите результат.
      </section>
    );
  }
  return (
    <section className="glass-dark relative flex flex-col gap-4 rounded-2xl p-5">
      <span className="text-[13px] font-medium text-[#93b2ff]">Следующая остановка</span>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-on-dark-muted">{scenario.category.title}</span>
        <span className="text-lg leading-snug font-semibold tracking-[-0.015em] text-white">{scenario.title}</span>
        <p className="text-sm text-[#b9c0cc]">{scenario.summary}</p>
      </div>
      <ScenarioTags scenario={scenario} tone="dark" withCategory={false} />
      <Link
        href={`/scenarios/${scenario.id}`}
        className={cn(buttonVariants({ size: "lg" }), "focus-visible:ring-[#93b2ff] focus-visible:ring-offset-hero")}
      >
        <PlayIcon className="size-4 fill-current" />
        Начать
      </Link>
    </section>
  );
}
