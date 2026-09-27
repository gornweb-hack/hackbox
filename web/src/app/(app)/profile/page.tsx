"use client";

import { ChevronDownIcon, ChevronRightIcon, TargetIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { EarnedTile, LockedTile } from "@/components/achievements/achievement-tiles";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { anyTested, trainingOf, useSkills } from "@/lib/analytics";
import { formatXp, useProgress, useShelf } from "@/lib/gamification";
import { type Outcome, OUTCOME_TITLES, useRunHistory } from "@/lib/runs";
import { SCALE_TITLES } from "@/lib/scales";
import { cn } from "@/lib/utils";

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const dateTime = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

const OUTCOME_DOTS: Record<Outcome, string> = { good: "bg-zone-green", ok: "bg-zone-yellow", bad: "bg-zone-red" };

// Профиль: уровень, навыки подробно, полка всех ачивок и история прохождений.
// Ссылки с главной ведут к разделам: #skills, #shelf, #history
export default function ProfilePage() {
  // Разделы грузятся по отдельности: пока выше не пришли данные, раздел из ссылки ещё сдвинется вниз.
  // Поэтому к нему прокручиваем, когда загрузилось всё
  const ready = [useSkills(), useShelf(), useRunHistory()].every((query) => !query.isPending);
  useEffect(() => {
    if (ready && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [ready]);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <LevelSummary />
      <Section id="skills" title="Навыки">
        <SkillsList />
      </Section>
      <Section id="shelf" title="Полка ачивок">
        <Shelf />
      </Section>
      <Section id="history" title="История прохождений">
        <History />
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    // scroll-mt — чтобы при переходе по якорю заголовок не прилипал к краю экрана
    <section id={id} className="glass relative flex scroll-mt-6 flex-col gap-4 rounded-xl p-5">
      <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}

const Unavailable = ({ what }: { what: string }) => (
  <p className="text-sm text-muted-foreground">{what} недоступны. Обновите страницу чуть позже.</p>
);

function LevelSummary() {
  const { data: progress } = useProgress();
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Профиль</h1>
      {progress && (
        <p className="text-sm text-muted-foreground">
          {progress.level.title} · {progress.level.speed} км/ч · {formatXp(progress.xp)} опыта
          {progress.next && ` · до ${progress.next.speed} км/ч — ${formatXp(progress.next.xp - progress.xp)} опыта`}
        </p>
      )}
    </div>
  );
}

// Навыки строками: процент, из чего он сложился, слабый выделен
function SkillsList() {
  const { data: skills, isPending, isError } = useSkills();
  if (isPending) return <Skeleton className="h-60 rounded-lg" />;
  if (isError) return <Unavailable what="Навыки" />;
  if (!anyTested(skills)) {
    return <p className="text-sm text-muted-foreground">Навыки появятся после первого сценария.</p>;
  }
  const training = trainingOf(skills);

  return (
    <>
      <p className="text-[13px] text-muted-foreground">
        Доля верных решений · учтено прохождений: {skills.runs}
      </p>
      <ul className="flex flex-col gap-3.5">
        {skills.skills.map((skill) => {
          const weak = skill.id === skills.weakest;
          return (
            <li key={skill.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("flex items-center gap-2 text-[15px]", weak && "font-semibold")}>
                  {skill.title}
                  {weak && (
                    <span className="rounded-full border border-primary-soft-border bg-primary-soft px-2 text-xs font-semibold text-primary-text">
                      самый слабый
                    </span>
                  )}
                </span>
                <span className="text-[15px] font-semibold">{skill.value === null ? "—" : `${skill.value}%`}</span>
              </div>
              <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full bg-primary" style={{ width: `${skill.value ?? 0}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {skill.tests ? `${skill.hits} из ${skill.tests} решений верно` : "Ещё не проверялся"}
              </span>
            </li>
          );
        })}
      </ul>
      {training && (
        <Link
          href={`/scenarios/${training.scenarioId}`}
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-auto min-h-[50px] py-3 text-center whitespace-normal sm:self-start")}
        >
          <TargetIcon className="size-[18px]" />
          Потренировать: {training.skill.title.toLowerCase()}
        </Link>
      )}
    </>
  );
}

// Все ачивки: полученные — с датой, закрытые — с прогрессом
function Shelf() {
  const { data: shelf, isPending, isError } = useShelf();
  if (isPending) return <Skeleton className="h-60 rounded-lg" />;
  if (isError) return <Unavailable what="Ачивки" />;
  const earned = shelf.items.filter((item) => item.earnedAt).length;

  return (
    <>
      <span className="text-[15px] text-muted-foreground">
        <span className="font-semibold text-foreground">{earned}</span> из {shelf.total} получено
      </span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {shelf.items.map((item) =>
          item.earnedAt ? (
            <EarnedTile
              key={item.id}
              label={`Получена ${dayMonth.format(new Date(item.earnedAt))}`}
              title={item.title}
              description={item.description}
            />
          ) : (
            <LockedTile key={item.id} label="Закрыта" {...item} />
          ),
        )}
      </div>
    </>
  );
}

// Сколько прохождений видно до «Смотреть больше»: история длинная и уводит профиль вниз
const HISTORY_PREVIEW = 3;

// История: исход, итоговые шкалы и ссылка на разбор каждого прохождения
function History() {
  const { data: history, isPending, isError } = useRunHistory();
  const [expanded, setExpanded] = useState(false);
  if (isPending) return <Skeleton className="h-60 rounded-lg" />;
  if (isError) return <Unavailable what="Прохождения" />;
  if (history.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Прохождений пока нет.{" "}
        <Link href="/scenarios" className="font-medium text-primary-text underline-offset-4 hover:underline">
          Открыть каталог
        </Link>
      </p>
    );
  }

  const hidden = history.items.length - HISTORY_PREVIEW;
  const runs = expanded ? history.items : history.items.slice(0, HISTORY_PREVIEW);

  return (
    <>
      <ul id="history-list" className="-mx-2 flex flex-col">
        {runs.map((run, i) => (
          <li
            key={run.id}
            className={cn(i >= HISTORY_PREVIEW && "duration-200 motion-safe:animate-in motion-safe:fade-in")}
          >
            <Link
              href={`/scenarios/runs/${run.id}`}
              className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", OUTCOME_DOTS[run.outcome])} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-medium">{run.title ?? "Сценарий убран из каталога"}</span>
                <span className="text-[13px] text-muted-foreground">
                  {OUTCOME_TITLES[run.outcome]} · {dateTime.format(new Date(run.finishedAt))}
                </span>
              </span>
              <span className="hidden shrink-0 text-right text-[13px] text-muted-foreground sm:block">
                {SCALE_TITLES.loyalty} {run.loyalty}
                <br />
                {SCALE_TITLES.safety} {run.safety}
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="history-list"
          onClick={() => setExpanded(!expanded)}
          className={cn(buttonVariants({ variant: "ghost" }), "glass-inner border-border sm:self-start")}
        >
          {expanded ? "Свернуть" : `Смотреть больше · ${hidden}`}
          <ChevronDownIcon className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </>
  );
}
