import { ClockIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { classLabel, type Scenario } from "@/lib/scenarios";

// «Световые линии» — след поезда на скорости: положение, длина и самая яркая точка градиента
const LINES = [
  { top: 30, right: -30, width: 280, peak: 0.95, at: 75 },
  { top: 42, right: 30, width: 170, peak: 0.55, at: 70 },
  { top: 58, right: -10, width: 340, peak: 0.3, at: 80 },
];

// Главная карточка — вход в следующую тренировку. Прохождений пока нет ни у кого,
// поэтому это первый сценарий каталога (состояние «новый сотрудник» из макета)
export function HeroCard({ scenario }: { scenario: Scenario }) {
  return (
    <section className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-xl bg-hero px-5 pt-[22px] pb-5 text-[#f3f5f8]">
      {LINES.map((line) => (
        <div
          key={line.top}
          aria-hidden
          className="pointer-events-none absolute h-px"
          style={{
            top: line.top,
            right: line.right,
            width: line.width,
            background: `linear-gradient(90deg, rgb(90 135 255 / 0), rgb(90 135 255 / ${line.peak}) ${line.at}%, rgb(90 135 255 / 0))`,
          }}
        />
      ))}
      <span className="relative text-[13px] font-medium text-[#93b2ff]">Первый сценарий</span>
      <div className="relative flex max-w-[620px] flex-col gap-2">
        <h2 className="text-[26px] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-white lg:text-[34px]">
          Начните с первого сценария
        </h2>
        <p className="text-[15px] leading-[1.45] text-pretty text-[#b9c0cc]">
          «{scenario.title}». {scenario.summary}
        </p>
      </div>
      <div className="relative flex flex-wrap gap-1.5">
        <HeroTag>{scenario.category.title}</HeroTag>
        <HeroTag>{classLabel(scenario.carClass)}</HeroTag>
        <HeroTag>
          <ClockIcon />~{scenario.durationMin} мин
        </HeroTag>
      </div>
      <Link
        href={`/scenarios/${scenario.id}`}
        className="relative flex h-[52px] w-full items-center justify-center gap-2.5 self-start rounded-lg bg-primary px-[26px] text-base font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/.08),0_8px_24px_-10px_rgb(46_100_255/.9)] transition-colors outline-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#93b2ff] active:scale-[.99] active:bg-primary-press lg:w-auto lg:min-w-[200px]"
      >
        <PlayIcon className="size-[18px] fill-current" />
        Начать
      </Link>
    </section>
  );
}

function HeroTag({ children }: { children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="h-7 gap-1.5 border-white/12 bg-white/7 px-2.5 text-[13px] font-normal text-[#dde2ea] [&>svg]:size-3.5!"
    >
      {children}
    </Badge>
  );
}
