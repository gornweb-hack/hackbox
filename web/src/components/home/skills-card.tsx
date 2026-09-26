"use client";

import { TargetIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { type SkillScore, type Skills, trainingOf, useSkills } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// Геометрия радара из макета: поле 320×290, центр (160, 145), радиус 84, подписи на радиусе 126
const WIDTH = 320;
const HEIGHT = 290;
const CX = 160;
const CY = 145;
const R = 84;
const LABEL_R = 126;
const RINGS = [0.25, 0.5, 0.75, 1];

// Точка на оси i из n: оси по часовой стрелке от верхней, share — доля радиуса
function point(i: number, n: number, share: number): [number, number] {
  const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
  return [CX + Math.cos(angle) * R * share, CY + Math.sin(angle) * R * share];
}

const polygon = (n: number, share: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => point(i, n, share(i)).join(",")).join(" ");

// «Навыки» на главной: радар шести компетенций, слабый навык выделен, кнопка — сценарий на него
export function SkillsCard({ className }: { className?: string }) {
  const { data: skills, isPending, isError } = useSkills();
  if (isPending) return <Skeleton className={cn("h-[460px] rounded-xl", className)} />;

  return (
    <HomeCard title="Навыки" href="/profile" linkLabel="Подробнее" className={className}>
      {isError ? (
        <p className="text-sm text-muted-foreground">Навыки недоступны. Обновите страницу чуть позже.</p>
      ) : skills.weakest === null ? (
        <SkillsPlaceholder count={skills.skills.length} />
      ) : (
        <SkillsBody skills={skills} />
      )}
    </HomeCard>
  );
}

function SkillsBody({ skills }: { skills: Skills }) {
  const [selected, setSelected] = useState<string | null>(null);
  const items = skills.skills;
  const n = items.length;
  const weakIndex = items.findIndex((skill) => skill.id === skills.weakest);
  const [wx, wy] = point(weakIndex, n, (items[weakIndex].value ?? 0) / 100);
  const training = trainingOf(skills);
  const chosen = items.find((skill) => skill.id === selected);

  return (
    <>
      <div className="relative mx-auto w-full max-w-[330px]" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={items.map((skill) => `${skill.title} ${skill.value ?? 0}%`).join(", ")}
          className="absolute inset-0 size-full overflow-visible"
        >
          {RINGS.map((ring) => (
            <polygon key={ring} points={polygon(n, () => ring)} className="fill-none stroke-border" />
          ))}
          {items.map((skill, i) => {
            const [x, y] = point(i, n, 1);
            const weak = i === weakIndex;
            return (
              <line
                key={skill.id}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                className={weak ? "stroke-primary" : "stroke-border"}
                strokeWidth={weak ? 1.5 : 1}
                strokeDasharray={weak ? "3 4" : undefined}
              />
            );
          })}
          <polygon
            points={polygon(n, (i) => (items[i].value ?? 0) / 100)}
            className="fill-primary/12 stroke-primary"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {items.map((skill, i) => {
            if (i === weakIndex) return null;
            const [x, y] = point(i, n, (skill.value ?? 0) / 100);
            return <circle key={skill.id} cx={x} cy={y} r={3} className="fill-primary" />;
          })}
          {/* Слабый навык: ореол и кольцо */}
          <circle cx={wx} cy={wy} r={10} className="fill-primary" fillOpacity={0.16} />
          <circle cx={wx} cy={wy} r={5} className="fill-card stroke-primary" strokeWidth={2.5} />
        </svg>
        {items.map((skill, i) => {
          const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
          const weak = i === weakIndex;
          return (
            <button
              key={skill.id}
              type="button"
              aria-pressed={selected === skill.id}
              onClick={() => setSelected(selected === skill.id ? null : skill.id)}
              style={{
                left: `${((CX + Math.cos(angle) * LABEL_R) / WIDTH) * 100}%`,
                top: `${((CY + Math.sin(angle) * LABEL_R) / HEIGHT) * 100}%`,
              }}
              className={cn(
                "absolute flex min-h-11 w-[104px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-md border border-transparent px-1 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary aria-pressed:border-border-strong",
                weak && "border-primary-soft-border bg-primary-soft text-primary-text hover:bg-primary-soft",
              )}
            >
              <span className={cn("text-center text-xs leading-[1.2] text-muted-foreground", weak && "font-semibold text-primary-text")}>
                {skill.title}
              </span>
              <span className="text-[13px] font-semibold">{skill.value === null ? "—" : `${skill.value}%`}</span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="min-h-[18px] text-center text-[13px] text-muted-foreground">
        {chosen ? describe(chosen, chosen.id === skills.weakest) : "Нажмите на навык, чтобы увидеть, из чего складывается процент"}
      </p>

      {training && (
        <Link
          href={`/scenarios/${training.scenarioId}`}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-primary-soft-border bg-primary-soft px-4 text-[15px] font-semibold text-primary-text transition-colors outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
          <TargetIcon className="size-[18px]" />
          Потренировать: {training.skill.title.toLowerCase()}
        </Link>
      )}
    </>
  );
}

// «Безопасность · самый слабый — 54% · 7 из 13 решений верно»
function describe(skill: SkillScore, weak: boolean) {
  const name = weak ? `${skill.title} · самый слабый` : skill.title;
  if (skill.value === null) return `${name} — ещё не проверялся`;
  return `${name} — ${skill.value}% · ${skill.hits} из ${skill.tests} решений верно`;
}

// Новичок: пустая пунктирная сетка радара и подпись (кадр 1b)
function SkillsPlaceholder({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center gap-3.5 pt-1.5 pb-1">
      <svg viewBox={`${CX - R - 4} ${CY - R - 4} ${2 * R + 8} ${2 * R + 8}`} aria-hidden className="w-36">
        {RINGS.map((ring) => (
          <polygon key={ring} points={polygon(count, () => ring)} className="fill-none stroke-border-strong" strokeDasharray="3 4" />
        ))}
      </svg>
      <div className="flex flex-col items-center gap-[3px] text-center">
        <span className="text-[15px] font-medium">Появится после первого сценария</span>
        <span className="text-[13px] text-muted-foreground">Компетенции ролевой модели проводника по вашим решениям</span>
      </div>
    </div>
  );
}
