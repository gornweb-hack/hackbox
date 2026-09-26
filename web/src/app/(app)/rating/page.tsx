"use client";

import { useState } from "react";
import { NotInRating, RatingRowItem, RatingSummary, ScopeSwitch } from "@/components/rating/rating-parts";
import { Skeleton } from "@/components/ui/skeleton";
import { type RatingScope, useRating } from "@/lib/gamification";

// Вся таблица рейтинга за месяц. Опыт — по правилам content/gamification.yaml, места — core/src/gamification/rating.ts
export default function RatingPage() {
  const [scope, setScope] = useState<RatingScope>("crew");
  const { data: rating, isPending, isError } = useRating(scope);

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Рейтинг</h1>
        <p className="text-sm text-muted-foreground">
          Опыт за календарный месяц. При равном опыте выше тот, кто набрал его раньше.
        </p>
      </div>

      <ScopeSwitch value={scope} onChange={setScope} />

      {isPending ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Рейтинг недоступен. Обновите страницу чуть позже.</p>
      ) : (
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold tracking-[-0.01em]">{rating.title ?? "Бригада не назначена"}</h2>
          {rating.me ? <RatingSummary rating={rating} me={rating.me} /> : <NotInRating rating={rating} />}
          {rating.items.length > 0 && (
            <ol className="flex flex-col gap-1">
              {rating.items.map((row) => (
                <RatingRowItem key={row.userId} row={row} />
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
