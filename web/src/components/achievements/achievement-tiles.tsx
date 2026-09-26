import { AwardIcon, LockIcon } from "lucide-react";
import type { ReactNode } from "react";

// Плитки ачивок по макету — на главной («Последняя», «Следующая») и на полке в профиле

// Полученная: награда в синем круге, над названием — подпись (например, «Последняя» или дата)
export function EarnedTile({ label, title, description }: { label: ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-muted p-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary-soft-border bg-primary-soft text-primary-text">
        <AwardIcon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{label}</span>
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-[13px] text-pretty text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}

// Закрытая: замок в пунктирном круге и прогресс, если он у ачивки есть
export function LockedTile({
  label,
  title,
  description,
  share,
  text,
}: {
  label: string;
  title: string;
  description: string;
  // Доля пути 0–1; null — у ачивки нет промежуточного прогресса («категория на отлично»)
  share: number | null;
  text: string | null;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-dashed border-border-strong p-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-muted-foreground">
        <LockIcon className="size-5" />
      </span>
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
