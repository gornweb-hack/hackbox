import { DumbbellIcon, ListIcon, PlayIcon, TargetIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ScenarioTags } from "@/components/scenario-tags";
import { buttonVariants } from "@/components/ui/button";
import type { Training } from "@/lib/analytics";
import { heroState, type Scenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

// «Световые линии» — след поезда на скорости: положение, длина и яркость. Белые, а не синие:
// синий в системе только у действий и прогресса
const LINES = [
  { top: 30, right: -30, width: 280, alpha: 0.28 },
  { top: 42, right: 30, width: 170, alpha: 0.16 },
  { top: 58, right: -10, width: 340, alpha: 0.09 },
];

// Главная карточка — вход в следующую тренировку. Новичку — первый сценарий (кадр 1b),
// дальше — сценарий на слабый навык (кадр 1a); без данных навыков — первый непройденный или каталог (кадр 1d)
export function HeroCard({ scenarios, training }: { scenarios: Scenario[]; training: Training | null }) {
  const state = heroState(scenarios, training);
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

  if (state.kind === "training") {
    const { scenario, skill } = state;
    return (
      <Frame
        kicker="Следующий сценарий"
        title={scenario.title}
        tags={<ScenarioTags scenario={scenario} tone="dark" />}
        reason={
          <>
            <span className="flex items-center gap-2 text-sm text-[#b9c0cc]">
              <DumbbellIcon className="size-4 text-[#93b2ff]" />
              Тренирует: <span className="font-medium text-white">{skill.title}</span>
            </span>
            <span className="flex items-center gap-2.5 rounded-lg border border-[rgb(147_178_255/.3)] bg-[rgb(46_100_255/.16)] px-4 py-3 text-sm text-[#dde6ff] shadow-[inset_0_1px_0_rgb(255_255_255/.12)]">
              <TargetIcon className="size-[18px] shrink-0 text-[#93b2ff]" />
              Ваш слабый навык — {skill.title}, {skill.value}%
            </span>
          </>
        }
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
  reason,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  tags?: ReactNode;
  // Почему предложен этот сценарий: навык, который он тренирует
  reason?: ReactNode;
  href: string;
  cta: ReactNode;
}) {
  return (
    <section className="glass-dark relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl px-[22px] pt-6 pb-[22px]">
      {LINES.map((line) => (
        <div
          key={line.top}
          aria-hidden
          className="pointer-events-none absolute h-px"
          style={{
            top: line.top,
            right: line.right,
            width: line.width,
            background: `rgb(255 255 255 / ${line.alpha})`,
          }}
        />
      ))}
      <span className="relative text-[13px] font-medium text-[#93b2ff]">{kicker}</span>
      <div className="relative flex max-w-[620px] flex-col gap-2">
        <h2 className="text-[26px] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-white lg:text-[34px]">
          {title}
        </h2>
        {subtitle && <p className="text-[15px] leading-[1.45] text-pretty text-[#b9c0cc]">{subtitle}</p>}
      </div>
      {tags && <div className="relative">{tags}</div>}
      {reason && <div className="relative flex flex-col items-start gap-3">{reason}</div>}
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "xl" }),
          "w-full self-start focus-visible:ring-[#93b2ff] focus-visible:ring-offset-hero lg:w-auto lg:min-w-[200px]",
        )}
      >
        {cta}
      </Link>
    </section>
  );
}
