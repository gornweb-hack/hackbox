"use client";

import { HeroCard } from "@/components/home/hero-card";
import { NewScenarioBanner } from "@/components/home/new-scenario-banner";
import { ScenariosCard } from "@/components/home/scenarios-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScenarios } from "@/lib/scenarios";

// Главная — табло прогресса и вход в следующую тренировку.
// Сетка 6 колонок на десктопе: главная карточка — 4, рядом встанет уровень; сценарии — 3, по макету
export default function HomePage() {
  const { data: scenarios, isPending, isError } = useScenarios();

  if (isPending) {
    return (
      <div className="grid gap-3 lg:grid-cols-6 lg:gap-5">
        <div className="flex flex-col gap-2 lg:col-span-4">
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-52 rounded-xl lg:col-span-3" />
      </div>
    );
  }
  if (isError || !scenarios.length) {
    return (
      <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
        {isError ? "Каталог сценариев недоступен. Обновите страницу чуть позже." : "Сценариев пока нет."}
      </p>
    );
  }

  // Плашка — только про новый сценарий, который ещё не пройден
  const fresh = scenarios.find((scenario) => scenario.isNew && !scenario.completed);
  return (
    <div className="grid gap-3 lg:grid-cols-6 lg:gap-5">
      <div className="flex min-w-0 flex-col gap-2 lg:col-span-4">
        {fresh && <NewScenarioBanner scenario={fresh} />}
        <HeroCard scenarios={scenarios} />
      </div>
      <ScenariosCard scenarios={scenarios} className="lg:col-span-3" />
    </div>
  );
}
