"use client";

import { LockIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useId, useLayoutEffect, useRef, useState } from "react";
import { ScenarioTags } from "@/components/scenario-tags";
import { formatXp, type Level } from "@/lib/gamification";
import { bestRuns, buildRoute, nextStop, trainPosition, UPCOMING, type Upcoming, upcomingBySegment } from "@/lib/route";
import type { Outcome, RunSummary } from "@/lib/runs";
import type { Scenario } from "@/lib/scenarios";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useTrainXp } from "@/lib/use-train-xp";
import { cn } from "@/lib/utils";

// Сколько поезд едет к новому опыту — главный момент экрана после прохождения
const RIDE_MS = 2400;

// Индекс последнего уровня, до которого хватает опыта
const levelIndex = (levels: Level[], xp: number) => levels.findLastIndex((level) => xp >= level.xp);

// Схема маршрута: рельсы со шпалами, станции-уровни и остановки-сценарии. Поезд стоит там, куда
// довёз опыт, а после прохождения доезжает от прошлой позиции до новой
export function RouteMap({ levels, scenarios, xp, history }: { levels: Level[]; scenarios: Scenario[]; xp: number; history: RunSummary[] }) {
  const route = buildRoute(levels, scenarios);
  const upcoming = upcomingBySegment(route, UPCOMING);
  const next = nextStop(scenarios);
  const best = bestRuns(history);
  const reduced = useReducedMotion();
  const { from, shown } = useTrainXp(xp, reduced);
  const box = useRef<HTMLOListElement>(null);
  // Центры кружков станций по вертикали — по ним ставятся рельсы и поезд
  const [centers, setCenters] = useState<number[]>([]);

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => {
      const stations = [...element.querySelectorAll<HTMLElement>("[data-station]")];
      setCenters(stations.map((station) => station.offsetTop + station.offsetHeight / 2));
    };
    // Первый замер — сразу, до отрисовки; дальше — при каждом изменении размеров схемы
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const yOf = (value: number) => {
    const { segment, share } = trainPosition(levels, value);
    return centers[segment] + share * (centers[segment + 1] - centers[segment]);
  };
  const ready = centers.length === levels.length && levels.length > 1;
  const top = ready ? centers[0] : 0;
  const length = ready ? centers[centers.length - 1] - top : 0;
  const trainY = ready ? yOf(shown) : 0;
  const ride: CSSProperties = reduced ? {} : { transition: `all ${RIDE_MS}ms cubic-bezier(.45,0,.2,1)` };
  const reached = levelIndex(levels, xp);
  // Поезд въехал на новую станцию — она вспыхивает, когда он доедет
  const arrived = levelIndex(levels, from) < reached ? reached : -1;

  return (
    <ol ref={box} className="relative flex flex-col">
      {ready && (
        <>
          <div className="absolute left-2 w-6" style={{ top, height: length }}>
            <Rails top={0} height={length} color="var(--border-strong)" />
          </div>
          <div className="absolute left-2 w-6 overflow-hidden" style={{ top, height: trainY - top, ...ride }}>
            <Rails top={0} height={length} color="var(--primary)" />
          </div>
          <Train y={trainY} style={ride} />
        </>
      )}
      {route.map((segment, index) => {
        const announce = upcoming.get(index);
        return (
          <li key={segment.from.speed} className="flex flex-col">
            <Station level={segment.from} reached={index <= reached} current={index === reached} arrived={index === arrived} />
            <div className="flex flex-col gap-3 py-5 pl-12">
              {segment.stops.map((scenario) => (
                <Stop key={scenario.id} scenario={scenario} isNext={scenario.id === next?.id} best={best.get(scenario.id)} />
              ))}
              {announce && <Announcement item={announce} speed={segment.from.speed} />}
              {segment.stops.length === 0 && !announce && <span className="h-6" />}
            </div>
            {index === route.length - 1 && (
              <Station
                level={segment.to}
                reached={reached === levels.length - 1}
                current={reached === levels.length - 1}
                arrived={arrived === levels.length - 1}
                last
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Рельсы: две тонкие линии и шпалы поперёк. Шпалы всегда серые; рельсы серые на всём пути,
// синие поверх — на пройденном участке
function Rails({ top, height, color }: { top: number; height: number; color: string }) {
  const ties = useId();
  return (
    <svg aria-hidden className="absolute left-0 w-6" style={{ top, height }} width="24" height={height}>
      <defs>
        <pattern id={ties} width="24" height="11" patternUnits="userSpaceOnUse">
          <rect x="2" y="4" width="20" height="3" rx="1" fill="var(--border-strong)" />
        </pattern>
      </defs>
      <rect width="24" height={height} fill={`url(#${ties})`} />
      <rect x="5" width="2.5" height={height} fill={color} />
      <rect x="16.5" width="2.5" height={height} fill={color} />
    </svg>
  );
}

// Поезд носом вниз, по ходу маршрута: графитовый корпус и янтарные огни, как у тёмных карточек-табло
function Train({ y, style }: { y: number; style: CSSProperties }) {
  return (
    <div role="img" aria-label="Ваш поезд" className="pointer-events-none absolute left-[7px] z-20" style={{ top: y - 20, ...style }}>
      <svg viewBox="0 0 26 40" aria-hidden className="h-10 w-[26px] drop-shadow motion-safe:animate-car-bob">
        <path d="M3 4 Q3 1 6 1 L20 1 Q23 1 23 4 L23 26 Q23 39 13 39 Q3 39 3 26 Z" fill="var(--hero)" />
        <rect x="6" y="6" width="14" height="6" rx="2" fill="#fff" opacity="0.3" />
        <rect x="3" y="16" width="20" height="2.5" fill="var(--amber)" />
        <path d="M7 27 Q13 33 19 27 L19 25 L7 25 Z" fill="#fff" opacity="0.3" />
        <circle cx="9" cy="33" r="1.6" fill="var(--amber)" />
        <circle cx="17" cy="33" r="1.6" fill="var(--amber)" />
      </svg>
    </div>
  );
}

// Станция — уровень: скорость, звание и порог опыта. Новая станция вспыхивает, когда поезд доезжает
function Station({ level, reached, current, arrived, last }: { level: Level; reached: boolean; current: boolean; arrived: boolean; last?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        data-station
        className={cn(
          "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-[5px] bg-card text-[11px] font-bold tabular-nums",
          reached ? "border-foreground text-foreground" : "border-border-strong text-muted-foreground",
        )}
      >
        {arrived && (
          <span
            aria-hidden
            className="absolute -inset-2 rounded-full border-2 border-foreground opacity-0 motion-safe:animate-ping"
            style={{ animationDelay: `${RIDE_MS + 450}ms`, animationIterationCount: 3 }}
          />
        )}
        {level.speed}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className={cn("text-[15px] leading-tight font-semibold", !reached && "text-muted-foreground")}>
          {level.title}
          {current && <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 align-middle text-[11px] font-semibold text-foreground">ваш уровень</span>}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {level.speed} км/ч · {level.xp === 0 ? "старт маршрута" : `от ${formatXp(level.xp)} опыта`}
          {last && " · конечная"}
        </span>
      </div>
    </div>
  );
}

// Точка остановки на рельсах
function StopDot({ className }: { className: string }) {
  return <span aria-hidden className={cn("absolute top-6 -left-[36px] z-10 size-4 rounded-full border-[3px]", className)} />;
}

const CARD =
  "relative flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-card transition-[border-color,box-shadow] outline-none hover:border-border-strong hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[.995]";

// Остановка — сценарий. Пройденная — «пробитый билет» со штампом лучшего результата,
// следующая — выделена и сразу предлагает начать
function Stop({ scenario, isNext, best }: { scenario: Scenario; isNext: boolean; best?: RunSummary }) {
  return (
    <div className="relative">
      <StopDot className={best ? "border-foreground bg-foreground" : isNext ? "border-foreground bg-card" : "border-border-strong bg-card"} />
      <Link href={`/scenarios/${scenario.id}`} className={cn(CARD, isNext && "border-foreground/40")}>
        {best && <TicketNotches />}
        <div className={cn("flex flex-col gap-0.5", best && "pr-28")}>
          <span className="text-[12px] font-medium text-muted-foreground">{scenario.category.title}</span>
          <span className="text-[15px] leading-snug font-semibold">{scenario.title}</span>
        </div>
        {best && <Stamp run={best} />}
        {isNext && (
          // Единственная синяя кнопка на маршруте: синий здесь — только действие и пройденный путь
          <span className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-muted-foreground">Следующая остановка</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground">
              <PlayIcon className="size-3.5 fill-current" />
              Начать
            </span>
          </span>
        )}
        {!best && !isNext && scenario.isNew && <span className="w-fit rounded-sm bg-foreground px-1.5 text-[11px] font-semibold text-background">Новый</span>}
        <ScenarioTags scenario={scenario} tone="light" withCategory={false} />
      </Link>
    </div>
  );
}

// Вырезы по краям, как у проездного билета
function TicketNotches() {
  return (
    <>
      <span aria-hidden className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full border bg-background" />
      <span aria-hidden className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full border bg-background" />
    </>
  );
}

// Чернила штампа по исходу: зелёный и красный — как у зон шкал, «Зачтено» — фиолетовые чернила
const STAMPS: Record<Outcome, { label: string; ink: string }> = {
  good: { label: "Отлично", ink: "border-zone-green text-zone-green" },
  ok: { label: "Зачтено", ink: "border-ink text-ink" },
  bad: { label: "Вернуться", ink: "border-zone-red text-zone-red" },
};

// Штамп компостера: исход лучшего прохождения, обе шкалы и дата
function Stamp({ run }: { run: RunSummary }) {
  const stamp = STAMPS[run.outcome];
  const date = new Date(run.finishedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  return (
    <span
      className={cn(
        "absolute top-3 right-4 flex -rotate-6 flex-col items-center rounded-md border-2 border-dashed px-2 py-1 font-mono text-[10px] leading-tight uppercase",
        stamp.ink,
      )}
      aria-label={`Лучший результат: ${stamp.label}, лояльность ${run.loyalty}, безопасность ${run.safety}, ${date}`}
    >
      <span className="text-[11px] font-bold tracking-wide">{stamp.label}</span>
      <span>
        Л {run.loyalty} · Б {run.safety}
      </span>
      <span>{date}</span>
    </span>
  );
}

// Анонс на пустом перегоне: ситуация из памятки, сценарий по ней ещё готовится
function Announcement({ item, speed }: { item: Upcoming; speed: number }) {
  return (
    <div className="relative">
      <StopDot className="border-dashed border-border-strong bg-card" />
      <div className="flex flex-col gap-1.5 rounded-xl border border-dashed bg-card/60 p-4 opacity-70">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <LockIcon className="size-3.5" />
          {item.category}
        </span>
        <span className="text-[15px] leading-snug font-semibold">{item.title}</span>
        <span className="text-[13px] text-muted-foreground">
          Готовится для {speed} км/ч · памятка, ситуация №{item.memo}
        </span>
      </div>
    </div>
  );
}
