"use client";

import { AchievementsCard } from "@/components/home/achievements-card";
import { HeroCard } from "@/components/home/hero-card";
import { LevelCard } from "@/components/home/level-card";
import { NewScenarioBanner } from "@/components/home/new-scenario-banner";
import { RatingCard } from "@/components/home/rating-card";
import { ReputationCard } from "@/components/home/reputation-card";
import { ScenariosCard } from "@/components/home/scenarios-card";
import { SkillsCard } from "@/components/home/skills-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trainingOf, useSkills } from "@/lib/analytics";
import { useScenarios } from "@/lib/scenarios";

// Главная — табло прогресса и вход в следующую тренировку. Сетка 6 колонок на десктопе, как в макете:
// главная карточка (4) и уровень (2), ниже репутация, рейтинг и навыки (по 2), затем сценарии (3) и ачивки (3). У каждой карточки свои загрузка и ошибка
export default function HomePage() {
  const { data: scenarios, isPending: scenariosPending, isError } = useScenarios();
  // Навыки выбирают сценарий для главной карточки; ждём их, чтобы карточка не сменилась на глазах.
  // Если аналитика недоступна, карточка предлагает следующий непройденный сценарий
  const skills = useSkills();
  const isPending = scenariosPending || skills.isPending;
  // Плашка — только про новый сценарий, который ещё не пройден
  const fresh = scenarios?.find((scenario) => scenario.isNew && !scenario.completed);

  return (
    <div className="grid gap-3 lg:grid-cols-6 lg:gap-5">
      <div className="flex min-w-0 flex-col gap-2 lg:col-span-4">
        {isPending ? (
          <>
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-72 rounded-xl" />
          </>
        ) : isError || scenarios.length === 0 ? (
          <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            {isError ? "Каталог сценариев недоступен. Обновите страницу чуть позже." : "Сценариев пока нет."}
          </p>
        ) : (
          <>
            {fresh && <NewScenarioBanner scenario={fresh} />}
            <HeroCard scenarios={scenarios} training={trainingOf(skills.data)} />
          </>
        )}
      </div>
      <LevelCard className="lg:col-span-2" />
      <ReputationCard className="lg:col-span-2" />
      <RatingCard className="lg:col-span-2" />
      <SkillsCard className="lg:col-span-2" />
      {scenarios && scenarios.length > 0 && <ScenariosCard scenarios={scenarios} className="lg:col-span-3" />}
      <AchievementsCard className="lg:col-span-3" />
    </div>
  );
}
