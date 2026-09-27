"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatXp, type Progress, useProgress } from "@/lib/gamification";
import { useCountUp } from "@/lib/use-count-up";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// «Уровень» на главной: уровни — вагоны одного состава слева направо, справа головной «Мастер ВСМ».
// Пройденные вагоны закрашены, текущий заполняется опытом, будущие — только контур.
// Уровни и пороги — из content/gamification.yaml через ядро
export function LevelCard({ className }: { className?: string }) {
  const { data: progress, isPending, isError } = useProgress();
  if (isPending) return <Skeleton className={cn("h-[300px] rounded-xl", className)} />;

  return (
    <HomeCard title="Уровень" href="/profile" linkLabel="Профиль" className={className}>
      {isError ? (
        <p className="text-sm text-muted-foreground">Уровень недоступен. Обновите страницу чуть позже.</p>
      ) : (
        <LevelBody progress={progress} />
      )}
    </HomeCard>
  );
}

function LevelBody({ progress }: { progress: Progress }) {
  const { levels, level, next, xp } = progress;
  const current = Math.max(0, levels.findIndex((item) => item.speed === level.speed));
  // Доля пути к следующему уровню в процентах, как в макете — с округлением вниз
  const pct = next ? Math.floor(progress.progress * 100) : 100;
  // Заливка текущего вагона и число в итоге дорастают до pct
  const shown = useCountUp(pct, 900);

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-muted-foreground">
          Вагон {current + 1} из {levels.length} · <Unit>{level.speed} км/ч</Unit>
        </span>
        <span className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">{level.title}</span>
      </div>

      <div
        role="img"
        aria-label={
          next
            ? `Состав из ${levels.length} вагонов-уровней: пройдено ${current}, вагон ${current + 1} заполнен на ${pct}%`
            : `Состав из ${levels.length} вагонов-уровней: все пройдены`
        }
        className="flex flex-col gap-1.5"
      >
        <div className="flex items-end gap-1">
          {levels.map((item, index) => (
            <Car
              key={item.speed}
              state={index < current || !next ? "done" : index === current ? "current" : "future"}
              fill={index === current ? shown : 0}
              filled={index === current && pct > 0}
              head={index === levels.length - 1}
            />
          ))}
        </div>
        <div className="-mt-1 h-0.5 rounded-full bg-border-strong" />
        <div className="flex gap-1">
          {levels.map((item, index) => (
            <span
              key={item.speed}
              className={cn("flex-1 text-center text-xs", index === current && "font-semibold", index > current && "text-muted-foreground")}
            >
              {item.speed}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t pt-3">
        <span className="text-[15px] font-semibold">
          {!next ? (
            "Весь состав собран"
          ) : pct === 0 ? (
            <>
              Новый вагон — <Unit>{formatXp(next.xp - xp)} опыта</Unit> до следующего
            </>
          ) : (
            <>
              Вагон заполнен на {shown}% — ещё <Unit>{formatXp(next.xp - xp)} опыта</Unit>
            </>
          )}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {next ? (
            <>
              Следующий вагон: «{next.title}», <Unit>{next.speed} км/ч</Unit>
            </>
          ) : (
            <>
              Максимальный уровень ВСМ · <Unit>{level.speed} км/ч</Unit>
            </>
          )}
        </span>
      </div>
    </>
  );
}

// Число с единицей не разрывается переносом: «250 км/ч», «600 опыта» — иначе строка ломается на «/»
function Unit({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

// Вагон состава: у головного скруглён нос. Заливка текущего — отдельный слой под окнами с жёстким краем
function Car({ state, fill, filled, head }: { state: "done" | "current" | "future"; fill: number; filled: boolean; head: boolean }) {
  const active = state !== "future";
  // Окна светлые на синем; у текущего пустого вагона — голубые, у будущих — серые
  const windows = state === "done" || filled ? "bg-white/55" : state === "current" ? "bg-primary-soft-border" : "bg-border";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className={cn(
          "relative h-[38px] overflow-hidden border-[1.5px]",
          head ? "rounded-[6px_20px_6px_6px]" : "rounded-md",
          state === "done" && "border-primary bg-primary",
          state === "current" && "border-primary bg-primary-soft",
          state === "future" && "border-border-strong bg-card",
        )}
      >
        {state === "current" && <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${fill}%` }} />}
        <div className={cn("absolute top-[7px] left-1.5 grid grid-cols-3 gap-[3px]", head ? "right-4" : "right-1.5")}>
          {[0, 1, 2].map((window) => (
            <span key={window} className={cn("h-2 rounded-[2px]", windows)} />
          ))}
        </div>
      </div>
      <div className="-mt-1 flex justify-around px-1.5">
        {[0, 1].map((wheel) => (
          <span key={wheel} className={cn("size-1.5 rounded-full", active ? "bg-foreground" : "bg-border-strong")} />
        ))}
      </div>
    </div>
  );
}
