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
import { cn } from "@/lib/utils";

// Карточки главной появляются лесенкой, каждая на 60 мс позже предыдущей. Классы выписаны целиком:
// Tailwind находит их в исходнике, а собранные из кусков строки он не увидит
const ENTER = "duration-300 fill-mode-both motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2";
const DELAYS = ["delay-0", "delay-60", "delay-120", "delay-180", "delay-240", "delay-300", "delay-360"];
const enter = (index: number) => cn(ENTER, DELAYS[index]);

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
      <div className={cn("flex min-w-0 flex-col gap-2 lg:col-span-4", enter(0))}>
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
      <LevelCard className={cn("lg:col-span-2", enter(1))} />
      <ReputationCard className={cn("lg:col-span-2", enter(2))} />
      <RatingCard className={cn("lg:col-span-2", enter(3))} />
      <SkillsCard className={cn("lg:col-span-2", enter(4))} />
      {scenarios && scenarios.length > 0 && <ScenariosCard scenarios={scenarios} className={cn("lg:col-span-3", enter(5))} />}
      <AchievementsCard className={cn("lg:col-span-3", enter(6))} />
    </div>
  );
}
