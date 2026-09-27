import type { ReactNode } from "react";
import { AchievementBadge } from "./achievement-badge";

// Плитки ачивок по макету — на главной («Последняя», «Следующая») и на полке в профиле

// Полученная: эмблема ачивки, над названием — подпись (например, «Последняя» или дата)
export function EarnedTile({ id, label, title, description }: { id: string; label: ReactNode; title: string; description: string }) {
  return (
    <div className="glass-inner flex gap-3 rounded-[20px] p-3.5">
      <AchievementBadge id={id} earned className="size-12" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{label}</span>
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-[13px] text-pretty text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}

// Закрытая: серая эмблема с замком и прогресс, если он у ачивки есть
export function LockedTile({
  id,
  label,
  title,
  description,
  share,
  text,
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  // Доля пути 0–1; null — у ачивки нет промежуточного прогресса («категория на отлично»)
  share: number | null;
  text: string | null;
}) {
  return (
    <div className="flex gap-3 rounded-[20px] border border-dashed border-border-strong p-3.5">
      <AchievementBadge id={id} earned={false} className="size-12" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-[13px] text-pretty text-muted-foreground">{description}</span>
        {(share !== null || text) && (
          <div className="mt-2 flex flex-col gap-[5px]">
            {share !== null && (
              <div
                role="progressbar"
                aria-label={`Прогресс ачивки «${title}»`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(share * 100)}
                className="h-1.5 overflow-hidden rounded-full bg-track"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
              </div>
            )}
            {text && <span className="text-xs text-muted-foreground">{text}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
