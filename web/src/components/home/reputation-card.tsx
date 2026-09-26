"use client";

import { ShieldIcon, SmileIcon } from "lucide-react";
import { ScaleMeter } from "@/components/run/scale-meter";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgress } from "@/lib/gamification";
import { SCALE_TITLES } from "@/lib/scales";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

const plural = new Intl.PluralRules("ru-RU");

// «1 последнее прохождение», «2 последних прохождения», «10 последних прохождений»
function lastRuns(count: number) {
  const form = plural.select(count);
  if (form === "one") return `${count} последнее прохождение`;
  return form === "few" ? `${count} последних прохождения` : `${count} последних прохождений`;
}

// «Репутация» на главной: среднее итоговых шкал за последние прохождения и тренд за неделю
export function ReputationCard({ className }: { className?: string }) {
  const { data: progress, isPending, isError } = useProgress();
  if (isPending) return <Skeleton className={cn("h-72 rounded-xl", className)} />;
  const reputation = progress?.reputation;

  return (
    <HomeCard title="Репутация" href="/profile" linkLabel="История" className={className}>
      {isError ? (
        <p className="text-sm text-muted-foreground">Репутация недоступна. Обновите страницу чуть позже.</p>
      ) : reputation ? (
        <>
          <ScaleMeter scale="loyalty" value={reputation.loyalty.value} delta={reputation.loyalty.weekDelta} deltaLabel="за неделю" />
          <ScaleMeter scale="safety" value={reputation.safety.value} delta={reputation.safety.weekDelta} deltaLabel="за неделю" />
          <span className="border-t pt-3 text-[13px] text-muted-foreground">Среднее за {lastRuns(reputation.runs)}</span>
        </>
      ) : (
        // Новичок: вместо шкал — заглушка из макета (кадр 1b)
        <div className="flex flex-col items-start gap-3.5 pt-1.5 pb-1">
          <div className="flex gap-2 text-muted-foreground">
            {[SmileIcon, ShieldIcon].map((Icon, index) => (
              <span key={index} className="flex size-10 items-center justify-center rounded-lg border border-dashed border-border-strong">
                <Icon className="size-5" />
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-[3px]">
            <span className="text-[15px] font-medium">Появится после первого сценария</span>
            <span className="text-[13px] text-muted-foreground">
              {SCALE_TITLES.loyalty} и {SCALE_TITLES.safety.toLowerCase()}, шкалы от 0 до 100
            </span>
          </div>
        </div>
      )}
    </HomeCard>
  );
}
