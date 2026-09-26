import { TrophyIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatXp, type Rating, type RatingRow, type RatingScope } from "@/lib/gamification";
import { initials } from "@/lib/names";
import { cn } from "@/lib/utils";

// Общие части карточки рейтинга на главной и страницы /rating

export const RATING_SCOPES: { value: RatingScope; label: string }[] = [
  { value: "crew", label: "Бригада" },
  { value: "depot", label: "Депо" },
  { value: "company", label: "Компания" },
];

// «2026-09» → «Сентябрь»
function monthTitle(month: string) {
  const name = new Intl.DateTimeFormat("ru-RU", { month: "long", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  return name[0].toUpperCase() + name.slice(1);
}

// Переключатель среза: бригада, депо, компания
export function ScopeSwitch({ value, onChange }: { value: RatingScope; onChange: (scope: RatingScope) => void }) {
  return (
    <div role="group" aria-label="Срез рейтинга" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      {RATING_SCOPES.map((scope) => (
        <button
          key={scope.value}
          type="button"
          aria-pressed={value === scope.value}
          onClick={() => onChange(scope.value)}
          className="h-11 rounded-[9px] text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-[0_1px_2px_rgb(16_18_22/0.08),0_0_0_1px_var(--border)]"
        >
          {scope.label}
        </button>
      ))}
    </div>
  );
}

// «3-е место из 6», под ним — сколько опыта до места выше; справа месяц рейтинга
export function RatingSummary({ rating, me }: { rating: Rating; me: NonNullable<Rating["me"]> }) {
  const { gap } = me;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] leading-none font-semibold tracking-[-0.025em]">{me.place}-е место</span>
          <span className="text-[15px] text-muted-foreground">из {rating.total}</span>
        </div>
        <span className="text-[13px] text-muted-foreground">
          {!gap
            ? "Вы на первом месте"
            : gap.xp > 0
              ? `до ${gap.place}-го — ${formatXp(gap.xp)} опыта`
              : // Опыта поровну, но сосед набрал его раньше: обгонит любое следующее прохождение
                `до ${gap.place}-го — ещё одно прохождение`}
        </span>
      </div>
      <span className="flex h-7 shrink-0 items-center rounded-full border px-3 text-[13px] text-muted-foreground">
        {monthTitle(rating.month)}
      </span>
    </div>
  );
}

// Строка таблицы: место, аватар, имя и опыт за месяц; своя строка выделена
export function RatingRowItem({ row }: { row: RatingRow }) {
  return (
    <li
      className={cn(
        "flex h-[52px] items-center gap-3 rounded-lg border border-transparent px-3",
        row.isMe && "border-primary-soft-border bg-primary-soft",
      )}
    >
      <span className="w-[18px] shrink-0 text-[15px] font-semibold text-muted-foreground">{row.place}</span>
      <Avatar>
        <AvatarFallback className={cn("bg-muted text-xs font-semibold", row.isMe && "bg-primary text-primary-foreground")}>
          {initials(row.name)}
        </AvatarFallback>
      </Avatar>
      <span className={cn("min-w-0 flex-1 truncate text-[15px] font-medium", row.isMe && "font-semibold")}>{row.name}</span>
      {row.isMe && (
        <span className="flex h-5 shrink-0 items-center rounded-md border border-primary-soft-border bg-card px-[7px] text-xs font-semibold text-primary-text">
          вы
        </span>
      )}
      <span className="shrink-0 text-[15px] font-semibold">{formatXp(row.xp)}</span>
    </li>
  );
}

// Вас нет в таблице — заглушка из макета (кадр 1b). Без бригады рейтинга бригады и депо не бывает
export function NotInRating({ rating }: { rating: Rating }) {
  return (
    <div className="flex flex-col items-start gap-3.5 pt-1.5 pb-1">
      <span className="flex size-10 items-center justify-center rounded-lg border border-dashed border-border-strong text-muted-foreground">
        <TrophyIcon className="size-5" />
      </span>
      <div className="flex flex-col gap-[3px]">
        <span className="text-[15px] font-medium">{rating.title ? "Вы пока не в рейтинге" : "Бригада не назначена"}</span>
        <span className="text-[13px] text-muted-foreground">
          {rating.title
            ? `Пройдите сценарий — и появитесь в таблице за ${monthTitle(rating.month).toLowerCase()}`
            : "Рейтинг ведётся по бригадам и депо — их назначает администратор"}
        </span>
      </div>
    </div>
  );
}
