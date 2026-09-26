"use client";

import { useState } from "react";
import { NotInRating, RatingRowItem, RatingSummary, ScopeSwitch } from "@/components/rating/rating-parts";
import { Skeleton } from "@/components/ui/skeleton";
import { type RatingScope, useRating } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// Сколько строк показывать на главной; остальное — на странице «Вся таблица»
const TOP = 3;

// «Рейтинг» на главной: место за месяц в бригаде, депо или компании, топ-3 и своя строка
export function RatingCard({ className }: { className?: string }) {
  const [scope, setScope] = useState<RatingScope>("crew");
  const { data: rating, isPending, isError } = useRating(scope);
  if (isPending) return <Skeleton className={cn("h-96 rounded-xl", className)} />;

  const me = rating?.me;
  return (
    <HomeCard title="Рейтинг" href="/rating" linkLabel="Вся таблица" className={className}>
      {isError ? (
        <p className="text-sm text-muted-foreground">Рейтинг недоступен. Обновите страницу чуть позже.</p>
      ) : !me ? (
        // Прохождения за месяц общие для всех срезов: кого нет в бригаде, того нет и в компании
        <NotInRating rating={rating} />
      ) : (
        <>
          <ScopeSwitch value={scope} onChange={setScope} />
          <RatingSummary rating={rating} me={me} />
          <ol className="flex flex-col gap-1">
            {rating.items.slice(0, TOP).map((row) => (
              <RatingRowItem key={row.userId} row={row} />
            ))}
            {me.place > TOP && (
              <>
                <li aria-hidden className="text-center text-sm leading-none text-muted-foreground">
                  ···
                </li>
                <RatingRowItem row={rating.items[me.place - 1]} />
              </>
            )}
          </ol>
        </>
      )}
    </HomeCard>
  );
}
