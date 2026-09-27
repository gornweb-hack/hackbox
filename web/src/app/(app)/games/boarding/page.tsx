"use client";

import { ArrowLeftIcon, RotateCcwIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BoardingGame } from "@/components/games/boarding/boarding-game";
import { Button, buttonVariants } from "@/components/ui/button";
import { ACTIONS, CASES, LATE, type Result } from "@/games/boarding/rules";
import { formatDelta } from "@/lib/scales";
import { cn } from "@/lib/utils";

// Страница мини-игры «Посадка»: игра и итог после трёх рейсов. «Сыграть ещё раз» пересоздаёт игру
export default function BoardingPage() {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const again = () => {
    setResult(null);
    setRound((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link href="/games" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Мини-игры
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">Посадка</h1>
        <p className="text-sm text-muted-foreground">
          Биометрия у двери не сработала — проверьте билет, документ и багаж и выберите действие по памятке. Три рейса, правила добавляются.
        </p>
      </div>

      <BoardingGame key={round} onFinish={setResult} />

      {result && <BoardingSummary result={result} onAgain={again} />}
    </div>
  );
}

function BoardingSummary({ result, onAgain }: { result: Result; onAgain: () => void }) {
  return (
    <section className="glass relative flex flex-col gap-4 rounded-xl p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Итоги смены</h2>
        <div className="flex items-center gap-1" aria-label={`${result.stars} из 3 звёзд`}>
          {[1, 2, 3].map((star) => (
            <StarIcon key={star} className={cn("size-7", star <= result.stars ? "fill-zone-yellow text-zone-yellow" : "text-border-strong")} />
          ))}
        </div>
        <p className="text-[15px] leading-snug">
          Верных решений: <span className="font-semibold">{result.correct}</span> из {result.total} · очки: {result.points}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="glass-inner rounded-full border px-3 py-1">Безопасность {formatDelta(result.safety)}</span>
        <span className="glass-inner rounded-full border px-3 py-1">Лояльность {formatDelta(result.loyalty)}</span>
        {result.missed > 0 && <span className="glass-inner rounded-full border px-3 py-1">Не успели посадить: {result.missed}</span>}
      </div>

      {(result.mistakes.length > 0 || result.lateOpened) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Разбор ошибок</h2>
          <ol className="flex flex-col gap-3">
            {result.mistakes.map((mistake, index) => {
              const rule = CASES[mistake.passenger.kind];
              return (
                <Mistake
                  key={index}
                  situation={`${rule.memo ? `Памятка, №${rule.memo} · ` : ""}${rule.title}`}
                  chosen={ACTIONS[mistake.action].label}
                  correct={ACTIONS[rule.correct].label}
                  weak={mistake.verdict === "weak"}
                  phrase={rule.phrase}
                  rule={rule.rule}
                />
              );
            })}
            {result.lateOpened && (
              <Mistake
                situation={`Памятка, №${LATE.memo} · ${LATE.title}`}
                chosen="Открыть двери"
                correct="Не открывать двери"
                weak={false}
                phrase={LATE.phrase}
                rule={LATE.rule}
              />
            )}
          </ol>
        </div>
      )}

      <p className="text-[13px] text-muted-foreground">Тренировка: результат мини-игры не меняет опыт и шкалы профиля.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onAgain} size="lg">
          <RotateCcwIcon className="size-4" />
          Сыграть ещё раз
        </Button>
        <Link href="/scenarios" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "glass-inner border-border")}>
          К сценариям
        </Link>
      </div>
    </section>
  );
}

function Mistake(props: { situation: string; chosen: string; correct: string; weak: boolean; phrase: string | null; rule: string }) {
  return (
    <li className="glass-inner flex flex-col gap-2 rounded-[20px] p-4">
      <span className="text-[13px] text-muted-foreground">
        {props.situation}
        {props.weak && " · слабый ответ"}
      </span>
      <p className="text-[15px]">
        <span className="text-muted-foreground line-through decoration-zone-red/60">{props.chosen}</span>
        {" → "}
        <span className="font-medium">{props.correct}</span>
      </p>
      {props.phrase && <p className="text-[15px] leading-snug">{props.phrase}</p>}
      <p className="rounded-lg border border-primary-soft-border bg-primary-soft px-4 py-3 text-sm leading-[1.45]">{props.rule}</p>
    </li>
  );
}
