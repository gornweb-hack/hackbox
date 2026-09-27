"use client";

import { ArrowLeftIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UnattendedItemGame } from "@/components/games/unattended-item/unattended-item-game";
import { Button, buttonVariants } from "@/components/ui/button";
import { ITEMS, type Outcome, type Result } from "@/games/unattended-item/rules";
import { formatDelta } from "@/lib/scales";
import { cn } from "@/lib/utils";

const OUTCOMES: Record<Outcome, { title: string; ink: string }> = {
  good: { title: "Отлично: по памятке", ink: "text-zone-green" },
  ok: { title: "Зачтено с замечанием", ink: "text-ink" },
  bad: { title: "Вернуться и повторить", ink: "text-zone-red" },
};

// Страница мини-игры: вагон и разбор после финала. «Сыграть ещё раз» пересоздаёт игру
export default function UnattendedItemPage() {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const again = () => {
    setResult(null);
    setRound((value) => value + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link href="/games" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Мини-игры
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">Бесхозная вещь</h1>
        <p className="text-sm text-muted-foreground">
          Каждый раз находка разная — и правильный ответ тоже. Касание прохода — идти, касание вещи — подойти и осмотреть. На компьютере можно
          стрелками.
        </p>
      </div>

      <UnattendedItemGame key={round} onFinish={setResult} />

      {result && (
        <section className="glass relative flex flex-col gap-3 rounded-xl p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
          <span className="text-[12px] font-medium text-muted-foreground">
            {ITEMS[result.kind].title} · памятка, {ITEMS[result.kind].memo}
          </span>
          <h2 className={cn("-mt-2 text-lg font-semibold", OUTCOMES[result.outcome].ink)}>{OUTCOMES[result.outcome].title}</h2>
          <p className="glass-inner rounded-[20px] px-4 py-3 text-[15px] leading-snug">{result.ending}</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="glass-inner rounded-full border px-3 py-1">Безопасность {formatDelta(result.safetyDelta)}</span>
            <span className="glass-inner rounded-full border px-3 py-1">Лояльность {formatDelta(result.loyaltyDelta)}</span>
          </div>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-snug">
            {result.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="text-[13px] text-muted-foreground">Тренировка: результат мини-игры не меняет опыт и шкалы профиля.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={again} size="lg">
              <RotateCcwIcon className="size-4" />
              Сыграть ещё раз
            </Button>
            <Link href="/scenarios" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "glass-inner border-border")}>
              К сценариям
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
