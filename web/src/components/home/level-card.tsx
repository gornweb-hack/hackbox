"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { formatXp, type Progress, useProgress } from "@/lib/gamification";
import { arcPath, CENTER, MAX_SPEED, pointAt, RADIUS, tickPath } from "@/lib/speedometer";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// «Уровень» на главной: спидометр 60→400 км/ч, опыт до следующего уровня и шкала уровней
export function LevelCard({ className }: { className?: string }) {
  const { data: progress, isPending, isError } = useProgress();
  if (isPending) return <Skeleton className={cn("h-[460px] rounded-xl", className)} />;

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
  const { level, next, xp } = progress;
  return (
    <>
      <div className="flex flex-col items-center">
        <Speedometer progress={progress} />
        {/* Число заходит в вырез дуги, как в макете */}
        <div className="-mt-[34px] flex items-baseline gap-1.5">
          <span className="text-[44px] leading-none font-semibold tracking-[-0.035em]">{level.speed}</span>
          <span className="text-[15px] text-muted-foreground">км/ч</span>
        </div>
        <span className="mt-1.5 text-[15px] font-semibold">{level.title}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[15px] font-semibold">
            {next ? `${formatXp(xp)} / ${formatXp(next.xp)}` : formatXp(xp)}{" "}
            <span className="text-[13px] font-normal text-muted-foreground">опыта</span>
          </span>
          <span className="text-[13px] text-muted-foreground">
            {next ? `до ${next.speed} км/ч — ${formatXp(next.xp - xp)} опыта` : "Максимальный уровень"}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Опыт до следующего уровня"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.progress * 100)}
          className="h-2 overflow-hidden rounded-full bg-track"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress.progress * 100}%` }} />
        </div>
        {progress.lastRunXp !== null && (
          <span className="text-[13px] text-muted-foreground">+{formatXp(progress.lastRunXp)} опыта за последнее прохождение</span>
        )}
      </div>

      <LevelSteps progress={progress} />
    </>
  );
}

// Спидометр по геометрии из макета (lib/speedometer.ts): дорожка, засечки, заполнение до текущего уровня,
// бледный отрезок пройденного пути к следующему, стрелка
function Speedometer({ progress }: { progress: Progress }) {
  const { level, next, levels } = progress;
  const speeds = levels.map((item) => item.speed);
  // Мелкие засечки каждые 20 км/ч, кроме совпадающих с уровнями — там крупные
  const minor = Array.from({ length: MAX_SPEED / 20 + 1 }, (_, i) => i * 20)
    .filter((speed) => !speeds.some((value) => Math.abs(value - speed) < 8))
    .map((speed) => tickPath(speed, RADIUS - 11, RADIUS - 6))
    .join("");
  const major = speeds.map((speed) => tickPath(speed, RADIUS - 16, RADIUS - 6)).join("");
  const reach = next ? level.speed + progress.progress * (next.speed - level.speed) : level.speed;
  const [x1, y1] = pointAt(level.speed, -14);
  const [x2, y2] = pointAt(level.speed, RADIUS - 22);

  return (
    <svg
      viewBox="0 0 300 196"
      role="img"
      aria-label={`Уровень ${level.speed} км/ч, ${level.title}`}
      className="block w-full max-w-[290px] overflow-visible"
    >
      <path d={arcPath(0, MAX_SPEED)} className="fill-none stroke-track" strokeWidth={4} strokeLinecap="round" />
      <path d={minor} className="fill-none stroke-border-strong" strokeWidth={1.2} strokeLinecap="round" />
      <path d={major} className="fill-none stroke-muted-foreground" strokeWidth={2} strokeLinecap="round" />
      <path d={arcPath(level.speed, reach)} className="fill-none stroke-primary" strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round" />
      <path
        d={arcPath(0, level.speed)}
        className="fill-none stroke-primary drop-shadow-[0_0_5px_var(--glow)]"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-foreground" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={CENTER.x} cy={CENTER.y} r={6} className="fill-card stroke-foreground" strokeWidth={2.5} />
    </svg>
  );
}

// Шкала уровней: пройденные — синие точки, текущий — с кольцом, будущие — серые
function LevelSteps({ progress }: { progress: Progress }) {
  const { levels, level } = progress;
  const current = levels.findIndex((item) => item.speed === level.speed);
  // Линия идёт от центра первой колонки до центра последней
  const inset = 50 / levels.length;
  const filled = levels.length > 1 ? current / (levels.length - 1) : 0;

  return (
    <div className="flex flex-col gap-2 border-t pt-1">
      <span className="pt-2.5 text-xs text-muted-foreground">Уровни, км/ч · порог опыта</span>
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${levels.length}, minmax(0, 1fr))` }}>
        <div aria-hidden className="absolute top-1.5 h-0.5 bg-track" style={{ left: `${inset}%`, right: `${inset}%` }} />
        <div
          aria-hidden
          className="absolute top-1.5 h-0.5 bg-primary"
          style={{ left: `${inset}%`, width: `calc(${filled} * (100% - ${2 * inset}%))` }}
        />
        {levels.map((item, index) => (
          <div key={item.speed} className="relative flex flex-col items-center gap-[3px]">
            <span
              className={cn(
                "size-3.5 rounded-full border-2",
                index < current && "border-primary bg-primary",
                index === current && "border-primary bg-card shadow-[0_0_0_4px_var(--primary-soft)]",
                index > current && "border-border-strong bg-card",
              )}
            />
            <span className={cn("mt-[3px] text-[13px]", index === current && "font-semibold", index > current && "text-muted-foreground")}>
              {item.speed}
            </span>
            <span className="text-xs text-muted-foreground">{formatXp(item.xp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
