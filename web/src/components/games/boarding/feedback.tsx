"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Verdict } from "@/games/boarding/rules";
import { cn } from "@/lib/utils";

const VERDICTS: Record<Verdict, { title: string; box: string; ink: string }> = {
  correct: { title: "Верно", box: "border-zone-green bg-zone-green-soft", ink: "text-zone-green" },
  weak: { title: "Слабо: вежливо, но не по стандарту", box: "border-zone-yellow bg-zone-yellow-soft", ink: "text-zone-yellow-text" },
  wrong: { title: "Ошибка", box: "border-zone-red bg-zone-red-soft", ink: "text-zone-red" },
};

// «Дальше» включается не сразу: разбор нужно успеть увидеть, а не проскочить двойным нажатием
const MIN_READ_MS = 700;

export interface FeedbackCard {
  verdict: Verdict;
  situation: string;
  // Верное действие — показывается, если выбрали не его
  correct: string;
  phrase: string | null;
  rule: string;
}

// Разбор решения: вердикт, верное действие, фраза из памятки и правило. Пока он открыт, часы стоят
export function Feedback({ card, onNext }: { card: FeedbackCard; onNext: () => void }) {
  const [ready, setReady] = useState(false);
  const style = VERDICTS[card.verdict];

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), MIN_READ_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border p-4 motion-safe:animate-in motion-safe:fade-in", style.box)}>
      <span className={cn("text-[17px] font-semibold", style.ink)}>{style.title}</span>
      <span className="text-[13px] text-muted-foreground">{card.situation}</span>
      {card.verdict !== "correct" && <span className="text-[15px] font-semibold">Верное действие: {card.correct}</span>}
      {card.phrase && <p className="text-[15px] leading-snug">{card.phrase}</p>}
      <p className="text-sm leading-snug text-muted-foreground">{card.rule}</p>
      <Button onClick={onNext} disabled={!ready} className="mt-1 h-11 self-start px-5 text-[15px]">
        Дальше
      </Button>
    </div>
  );
}
