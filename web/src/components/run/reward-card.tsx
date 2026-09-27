"use client";

import { AchievementBadge } from "@/components/achievements/achievement-badge";
import { ApiError } from "@/lib/api";
import { type Reward, useReward } from "@/lib/gamification";
import { useCountUp } from "@/lib/use-count-up";

// Награда за прохождение из геймификации: опыт и ачивки, заработанные именно этим прохождением.
// Пока ядро не обработало событие о финале, награды ещё нет — карточка ждёт progress.updated
export function RunReward({ runId }: { runId: string }) {
  const { data: reward, error } = useReward(runId);
  if (reward) return <RewardCard reward={reward} />;
  const pending = !error || (error instanceof ApiError && error.code === "REWARD_PENDING");
  return (
    <section className="flex flex-col gap-2 rounded-[20px] border border-dashed border-border-strong px-5 py-5">
      <span className="text-[13px] text-muted-foreground">Награда за прохождение</span>
      <p className="text-[15px] font-semibold">
        {pending ? "Награда ещё не начислена" : "Не удалось загрузить награду"}
      </p>
    </section>
  );
}

// Награда за прохождение — светлое стекло (тёмное на экране разбора у итога): опыт набегает, ачивки появляются по одной
export function RewardCard({ reward }: { reward: Reward }) {
  const xp = useCountUp(reward.xp, 1000);
  return (
    <section className="glass relative flex flex-col gap-4 rounded-xl px-5 pt-5 pb-[22px] fill-mode-both motion-safe:animate-in motion-safe:fade-in">
      <h2 className="text-base font-semibold tracking-[-0.01em]">Награда за прохождение</h2>
      <p className="flex items-baseline gap-2">
        <span className="text-[44px] leading-none font-semibold tracking-[-0.04em]">+{xp}</span>
        <span className="text-[15px] text-muted-foreground">опыта</span>
      </p>
      {reward.achievements.map((achievement, index) => (
        <div
          key={achievement.id}
          style={{ animationDelay: `${900 + index * 250}ms` }}
          className="glass-inner flex items-center gap-4 rounded-[20px] px-4 py-3.5 fill-mode-both motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90"
        >
          <AchievementBadge id={achievement.id} earned className="size-12" />
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{achievement.title}</span>
            <span className="text-[13px] text-muted-foreground">{achievement.description}</span>
          </span>
        </div>
      ))}
    </section>
  );
}
