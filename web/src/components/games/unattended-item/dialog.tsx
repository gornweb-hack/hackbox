import type { ReactNode } from "react";
import { Bust } from "@/components/run/novel/bust";
import { LOOKS } from "@/components/run/scene/head";
import { SPEAKERS, type Speaker } from "@/games/unattended-item/layout";

// Шторка поверх вагона по рецепту модалок: вагон под ней затемнён и размыт, сама панель — плотное стекло
export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center overflow-y-auto bg-[rgb(15_18_23/.35)] p-3 backdrop-blur-[6px] motion-safe:animate-in motion-safe:fade-in">
      <section className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-popover p-5 shadow-(--glass-shadow) backdrop-blur-xl backdrop-saturate-180 motion-safe:animate-in motion-safe:slide-in-from-bottom-4">
        {children}
      </section>
    </div>
  );
}

// Диалог в стиле новеллы: бюст говорящего, кто он, реплика и варианты ответа
export function Dialog({ speaker, phrase, options }: { speaker: Speaker; phrase: string; options: { label: string; onPick: () => void }[] }) {
  const who = SPEAKERS[speaker];
  return (
    <Sheet>
      <div className="flex items-end gap-3">
        <div className="-mt-16 w-24 shrink-0">
          <Bust look={LOOKS[who.look]} coat={who.coat} emotion={who.emotion} />
        </div>
        <span className="pb-1 text-[13px] text-muted-foreground">
          {who.name} · {who.role}
        </span>
      </div>
      <p className="text-[17px] leading-snug">«{phrase}»</p>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={option.onPick}
            className="glass-inner min-h-[50px] rounded-lg border border-border px-4 py-3 text-left text-[15px] leading-snug transition-[transform,border-color] duration-150 ease-(--ease-spring) outline-none hover:border-white focus-visible:ring-2 focus-visible:ring-primary active:scale-[.985]"
          >
            {option.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
