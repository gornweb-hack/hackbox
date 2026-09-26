"use client";

import { AwardIcon, LockIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { type AchievementsSummary, useProgress } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// «Ачивки» на главной: сколько получено, последняя и следующая с прогрессом. Правила — в content/gamification.yaml
export function AchievementsCard({ className }: { className?: string }) {
  const { data: progress, isPending, isError } = useProgress();
  if (isPending) return <Skeleton className={cn("h-64 rounded-xl", className)} />;

  return (
    <HomeCard title="Ачивки" href="/profile" linkLabel="Полка" className={className}>
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
          <div className="flex gap-3 rounded-lg bg-muted p-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary-soft-border bg-primary-soft text-primary-text">
              <AwardIcon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Последняя
                {latest.isNew && (
                  <span className="flex h-[18px] items-center rounded-[5px] bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    Новая
                  </span>
                )}
              </span>
              <span className="text-[15px] font-semibold">{latest.title}</span>
              <span className="text-[13px] text-pretty text-muted-foreground">{latest.description}</span>
            </div>
          </div>
        )}
        {next && (
          <div className="flex gap-3 rounded-lg border border-dashed border-border-strong p-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-muted-foreground">
              <LockIcon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Следующая</span>
              <span className="text-[15px] font-semibold">{next.title}</span>
              <span className="text-[13px] text-pretty text-muted-foreground">{next.description}</span>
              {/* У ачивок вида «категория на отлично» промежуточного прогресса нет — полосу не показываем */}
              {(next.share !== null || next.text) && (
                <div className="mt-2 flex flex-col gap-[5px]">
                  {next.share !== null && (
                    <div
                      role="progressbar"
                      aria-label={`Прогресс ачивки «${next.title}»`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(next.share * 100)}
                      className="h-1.5 overflow-hidden rounded-full bg-track"
                    >
                      <div className="h-full rounded-full bg-primary" style={{ width: `${next.share * 100}%` }} />
                    </div>
                  )}
                  {next.text && <span className="text-xs text-muted-foreground">{next.text}</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
