import { ArrowRightIcon, SearchIcon, TicketCheckIcon } from "lucide-react";
import Link from "next/link";

// Мини-игры — короткие тренировки отдельных навыков по памятке «Ситуации на борту».
// Это тренировка: опыт и шкалы профиля они не меняют, их начисляет только движок сценариев
export default function GamesPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Мини-игры</h1>
        <p className="text-sm text-muted-foreground">
          Короткие тренировки одного навыка на 1–2 минуты. В профиль не идут — это разминка перед сценариями.
        </p>
      </div>
      <Link
        href="/games/unattended-item"
        className="glass glass-press relative flex items-center gap-4 rounded-xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="glass-inner flex size-11 shrink-0 items-center justify-center rounded-md shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(255_255_255/.6)]">
          <SearchIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[12px] font-medium text-muted-foreground">Безопасность · памятка, №14, №20, №41</span>
          <span className="text-base font-semibold">Бесхозная вещь</span>
          <span className="text-sm text-muted-foreground">
            Осмотрите салон и найдите оставленную вещь. Сумка, рюкзак, коробка с запахом гари или игрушка — у каждой свой правильный ответ.
          </span>
        </span>
        <ArrowRightIcon className="size-5 shrink-0 text-muted-foreground" />
      </Link>
      <Link
        href="/games/boarding"
        className="glass glass-press relative flex items-center gap-4 rounded-xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="glass-inner flex size-11 shrink-0 items-center justify-center rounded-md shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(255_255_255/.6)]">
          <TicketCheckIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[12px] font-medium text-muted-foreground">Правила посадки · памятка, №1–6, №32, №39</span>
          <span className="text-base font-semibold">Посадка</span>
          <span className="text-sm text-muted-foreground">
            Биометрия не сработала — проверьте билет, документ и багаж вручную, пока поезд не ушёл. Три рейса, правила добавляются.
          </span>
        </span>
        <ArrowRightIcon className="size-5 shrink-0 text-muted-foreground" />
      </Link>
    </div>
  );
}
