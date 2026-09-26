"use client";

import { StarIcon } from "lucide-react";
import type { RunReward } from "@/lib/demo";
import { useCountUp } from "@/lib/use-count-up";

// Награда за прохождение: опыт набегает, ачивки появляются по одной
export function RewardCard({ reward }: { reward: RunReward }) {
  const xp = useCountUp(reward.xp, 1000);
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-hero px-5 pt-5 pb-5 motion-safe:animate-in motion-safe:fade-in fill-mode-both">
      <span className="text-[15px] text-[#9aa3b2]">Награда за прохождение</span>
      <p className="text-[34px] leading-none font-semibold tracking-[-0.025em] text-white">+{xp} опыта</p>
      {reward.achievements.map((achievement, index) => (
        <div
          key={achievement.id}
          style={{ animationDelay: `${900 + index * 250}ms` }}
          className="flex items-center gap-4 rounded-xl bg-white/7 px-4 py-3.5 fill-mode-both motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary">
            <StarIcon className="size-5 fill-white text-white" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[17px] font-semibold text-white">{achievement.title}</span>
            <span className="text-[15px] text-[#9aa3b2]">{achievement.description}</span>
          </span>
        </div>
      ))}
    </section>
  );
}
