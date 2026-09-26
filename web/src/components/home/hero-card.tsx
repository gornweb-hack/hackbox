import { ListIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ScenarioTags } from "@/components/scenario-tags";
import { heroState, type Scenario } from "@/lib/scenarios";

// «Световые линии» — след поезда на скорости: положение, длина и самая яркая точка градиента
const LINES = [
  { top: 30, right: -30, width: 280, peak: 0.95, at: 75 },
  { top: 42, right: 30, width: 170, peak: 0.55, at: 70 },
  { top: 58, right: -10, width: 340, peak: 0.3, at: 80 },
];

// Главная карточка — вход в следующую тренировку. Новичку — первый сценарий (кадр 1b),
// дальше — первый непройденный, когда пройдено всё — каталог (кадр 1d)
export function HeroCard({ scenarios }: { scenarios: Scenario[] }) {
  const state = heroState(scenarios);
  if (!state) return null;

  if (state.kind === "done") {
    return (
      <Frame
        kicker="Каталог сценариев"
        title="Все сценарии пройдены"
        subtitle="Пройдите любой ещё раз, чтобы улучшить результат."
        href="/scenarios"
        cta={
          <>
            <ListIcon className="size-[18px]" />
            Открыть каталог
          </>
        }
      />
    );
  }

  const { scenario } = state;
  const first = state.kind === "first";
  return (
    <Frame
      kicker={first ? "Первый сценарий" : "Следующий сценарий"}
      title={first ? "Начните с первого сценария" : scenario.title}
      subtitle={first ? `«${scenario.title}». ${scenario.summary}` : scenario.summary}
      tags={<ScenarioTags scenario={scenario} tone="dark" />}
      href={`/scenarios/${scenario.id}`}
      cta={
        <>
          <PlayIcon className="size-[18px] fill-current" />
          Начать
        </>
      }
    />
  );
}

function Frame({
  kicker,
  title,
  subtitle,
  tags,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  tags?: ReactNode;
  href: string;
  cta: ReactNode;
}) {
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
      <span className="relative text-[13px] font-medium text-[#93b2ff]">{kicker}</span>
      <div className="relative flex max-w-[620px] flex-col gap-2">
        <h2 className="text-[26px] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-white lg:text-[34px]">
          {title}
        </h2>
        <p className="text-[15px] leading-[1.45] text-pretty text-[#b9c0cc]">{subtitle}</p>
      </div>
      {tags && <div className="relative">{tags}</div>}
      <Link
        href={href}
        className="relative flex h-[52px] w-full items-center justify-center gap-2.5 self-start rounded-lg bg-primary px-[26px] text-base font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/.08),0_8px_24px_-10px_rgb(46_100_255/.9)] transition-colors outline-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#93b2ff] active:scale-[.99] active:bg-primary-press lg:w-auto lg:min-w-[200px]"
      >
        {cta}
      </Link>
    </section>
  );
}
