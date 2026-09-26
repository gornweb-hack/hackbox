"use client";

import { EarnedTile, LockedTile } from "@/components/achievements/achievement-tiles";
import { Skeleton } from "@/components/ui/skeleton";
import { type AchievementsSummary, useProgress } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// «Ачивки» на главной: сколько получено, последняя и следующая с прогрессом. Правила — в content/gamification.yaml
export function AchievementsCard({ className }: { className?: string }) {
  const { data: progress, isPending, isError } = useProgress();
  if (isPending) return <Skeleton className={cn("h-64 rounded-xl", className)} />;

  return (
    <HomeCard title="Ачивки" href="/profile#shelf" linkLabel="Полка" className={className}>
      {isError ? (
        <p className="text-sm text-muted-foreground">Ачивки недоступны. Обновите страницу чуть позже.</p>
      ) : (
        <AchievementsBody achievements={progress.achievements} />
      )}
    </HomeCard>
  );
}

function AchievementsBody({ achievements }: { achievements: AchievementsSummary }) {
  const { earned, total, latest, next } = achievements;
  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-[40px] leading-none font-semibold tracking-[-0.035em]">{earned}</span>
        <span className="text-lg text-muted-foreground">из {total}</span>
        <span className="text-[15px] text-muted-foreground">получено</span>
      </div>
      {/* Новичку — только «Следующая», как в кадре 1b */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
        {latest && (
          <EarnedTile
            label={
              <>
                Последняя
                {latest.isNew && (
                  <span className="flex h-[18px] items-center rounded-[5px] bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    Новая
                  </span>
                )}
              </>
            }
            title={latest.title}
            description={latest.description}
          />
        )}
        {next && <LockedTile label="Следующая" {...next} />}
      </div>
    </>
  );
}
