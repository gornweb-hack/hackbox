"use client";

import { HeroCard } from "@/components/home/hero-card";
import { NewScenarioBanner } from "@/components/home/new-scenario-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { useScenarios } from "@/lib/scenarios";

// Главная — табло прогресса и вход в следующую тренировку.
// На десктопе сетка из 6 колонок: главная карточка занимает 4, рядом встанет уровень
export default function HomePage() {
  const { data: scenarios, isPending, isError } = useScenarios();
  const first = scenarios?.[0];
  const fresh = scenarios?.find((scenario) => scenario.isNew);

  return (
    <div className="grid gap-3 lg:grid-cols-6 lg:gap-5">
      <div className="flex min-w-0 flex-col gap-2 lg:col-span-4">
        {isPending ? (
          <>
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-72 rounded-xl" />
          </>
        ) : isError || !first ? (
          <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            {isError ? "Каталог сценариев недоступен. Обновите страницу чуть позже." : "Сценариев пока нет."}
          </p>
        ) : (
          <>
            {fresh && <NewScenarioBanner scenario={fresh} />}
            <HeroCard scenario={first} />
          </>
        )}
      </div>
    </div>
  );
}
