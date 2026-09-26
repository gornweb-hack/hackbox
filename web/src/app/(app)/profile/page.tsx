"use client";

import { ChevronRightIcon, TargetIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect } from "react";
import { EarnedTile, LockedTile } from "@/components/achievements/achievement-tiles";
import { Skeleton } from "@/components/ui/skeleton";
import { trainingOf, useSkills } from "@/lib/analytics";
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
    <section id={id} className="flex scroll-mt-6 flex-col gap-4 rounded-xl border bg-card p-5 shadow-card">
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
  if (skills.weakest === null) {
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
                    <span className="rounded-md border border-primary-soft-border bg-primary-soft px-1.5 text-xs font-semibold text-primary-text">
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
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-primary-soft-border bg-primary-soft px-4 text-[15px] font-semibold text-primary-text transition-colors outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-primary sm:self-start"
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

// История: исход, итоговые шкалы и ссылка на разбор каждого прохождения
function History() {
  const { data: history, isPending, isError } = useRunHistory();
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

  return (
    <ul className="-mx-2 flex flex-col">
      {history.items.map((run) => (
        <li key={run.id}>
          <Link
            href={`/scenarios/runs/${run.id}`}
            className="flex min-h-14 items-center gap-3 rounded-md px-2 py-2 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
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
  );
}
