"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AchievementBadge } from "@/components/achievements/achievement-badge";
import { Button } from "@/components/ui/button";
import type { Level } from "@/lib/gamification";
import type { Unlock } from "@/lib/unlocks";

// Праздник по центру экрана: новый уровень и новые ачивки по очереди. Жетон делает оборот, как монета,
// по нему пробегает блик, вокруг мерцают искры и вращается сияние (анимации unlock-* в globals.css).
// Рисуется в body через портал: у стеклянных карточек backdrop-filter, и fixed внутри них не на весь экран
export function UnlockOverlay({ unlocks, onDone }: { unlocks: Unlock[]; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const unlock = unlocks[index];
  const last = index === unlocks.length - 1;
  const next = () => (last ? onDone() : setIndex(index + 1));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!unlock) return null;
  const text =
    unlock.kind === "level"
      ? { eyebrow: "Новый уровень", title: unlock.level.title, description: `Ваш поезд разогнался до ${unlock.level.speed} км/ч` }
      : { eyebrow: "Новая ачивка", title: unlock.achievement.title, description: unlock.achievement.description };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${text.eyebrow}: ${text.title}`}
      onClick={next}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b0c10]/75 p-6 backdrop-blur-sm duration-300 motion-safe:animate-in motion-safe:fade-in"
    >
      <div key={index} onClick={(event) => event.stopPropagation()} className="flex max-w-sm flex-col items-center gap-5 text-center">
        <div className="relative flex size-64 items-center justify-center">
          <Rays />
          <Sparkles />
          <div className="relative size-40 motion-safe:animate-unlock-spin">
            <div className="motion-safe:animate-unlock-float">
              <div className="relative overflow-hidden rounded-full">
                {unlock.kind === "level" ? <LevelToken level={unlock.level} /> : <AchievementBadge id={unlock.achievement.id} earned className="size-40" />}
                {/* Блик пробегает по жетону */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-unlock-shine"
                />
              </div>
            </div>
          </div>
        </div>
        <span className="text-[13px] font-semibold tracking-[0.12em] text-amber uppercase">{text.eyebrow}</span>
        <h2 className="-mt-2 text-[26px] leading-tight font-semibold text-balance text-white">{text.title}</h2>
        <p className="-mt-2 text-[15px] text-pretty text-white/70">{text.description}</p>
        <Button onClick={next} className="h-11 min-w-40 px-6 text-[15px]">
          {last ? "Отлично" : "Дальше"}
        </Button>
        {unlocks.length > 1 && (
          <span className="text-[13px] text-white/50 tabular-nums">
            {index + 1} из {unlocks.length}
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}

// Медленно вращающееся сияние за жетоном: янтарные лучи, которые тают к краям
function Rays() {
  const style: CSSProperties = {
    background:
      "conic-gradient(from 0deg, transparent 0 6%, rgb(255 176 32 / 0.45) 9%, transparent 12% 31%, rgb(255 176 32 / 0.45) 34%, transparent 37% 56%, rgb(255 176 32 / 0.45) 59%, transparent 62% 81%, rgb(255 176 32 / 0.45) 84%, transparent 87%)",
    maskImage: "radial-gradient(circle, black 25%, transparent 68%)",
    WebkitMaskImage: "radial-gradient(circle, black 25%, transparent 68%)",
  };
  return <div aria-hidden className="absolute inset-0 rounded-full motion-safe:animate-unlock-rays" style={style} />;
}

// Искры вокруг жетона мерцают вразнобой
const SPARKS = [
  { top: "8%", left: "22%", size: 14, delay: 0 },
  { top: "14%", left: "78%", size: 18, delay: 0.4 },
  { top: "46%", left: "4%", size: 12, delay: 0.8 },
  { top: "52%", left: "92%", size: 14, delay: 0.2 },
  { top: "84%", left: "18%", size: 16, delay: 0.6 },
  { top: "88%", left: "72%", size: 12, delay: 1 },
];

function Sparkles() {
  return (
    <>
      {SPARKS.map((spark) => (
        <svg
          key={`${spark.top}${spark.left}`}
          aria-hidden
          viewBox="0 0 20 20"
          width={spark.size}
          height={spark.size}
          className="absolute opacity-0 motion-safe:animate-unlock-twinkle"
          style={{ top: spark.top, left: spark.left, animationDelay: `${spark.delay}s` }}
        >
          <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0 Z" fill="#ffd27a" />
        </svg>
      ))}
    </>
  );
}

// Жетон нового уровня: табло скорости, как на спидометре главной, — янтарные цифры на графите
function LevelToken({ level }: { level: Level }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="block size-40">
      <circle cx="32" cy="32" r="31" fill="#15171c" />
      <circle cx="32" cy="32" r="25" fill="#23406b" />
      <path d="M32 7 A25 25 0 0 1 32 57 Z" fill="#000" opacity="0.15" />
      {/* Дуга спидометра */}
      <path d="M15 42 A19 19 0 1 1 49 42" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 42 A19 19 0 0 1 44 18" fill="none" stroke="#ffb020" strokeWidth="3" strokeLinecap="round" />
      <text x="32" y="36" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="ui-monospace, monospace" fill="#ffb020">
        {level.speed}
      </text>
      <text x="32" y="45" textAnchor="middle" fontSize="6" fontFamily="system-ui, sans-serif" fill="#ffffff" fillOpacity="0.75">
        км/ч
      </text>
    </svg>
  );
}
