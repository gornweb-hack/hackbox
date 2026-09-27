"use client";

import { BellIcon, LogOutIcon, SettingsIcon, UserRoundPenIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Portrait, portraitOf } from "@/components/portrait";
import { PortraitPicker } from "@/components/portrait-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Me, useLogout } from "@/lib/auth";
import { useProgress } from "@/lib/gamification";
import { initials } from "@/lib/names";
import { useCloseNotifications, useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";

// Шапка над содержимым: кто вошёл, его уровень и бригада, колокольчик со счётчиком непрочитанных.
// Выход, администрирование и смена портрета в макете не предусмотрены — они в меню по нажатию на аватар
export function ProfileHeader({ me }: { me: Me }) {
  const logout = useLogout();
  // Титул — название уровня из геймификации
  const { data: progress } = useProgress();
  // «Бригада 3 · Депо Москва-ВСМ»; у сотрудника без бригады строки нет
  const crew = [me.crew, me.depot].filter(Boolean).join(" · ");
  const unread = useNotifications().data?.unread ?? 0;
  const [picking, setPicking] = useState(false);
  const portrait = portraitOf(me.avatar);

  return (
    <header className="flex items-center gap-3.5 px-1 pt-2 pb-2.5 lg:p-0 lg:pb-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Меню профиля"
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          {/* Кольцо: зазор цвета фона, затем тонкая синяя обводка */}
          <Avatar className="size-14 shadow-[0_0_0_2px_var(--background),0_0_0_3.5px_var(--primary)] after:hidden">
            {portrait ? (
              <AvatarFallback>
                <Portrait id={portrait.id} />
              </AvatarFallback>
            ) : (
              <>
                <AvatarFallback className="bg-[linear-gradient(160deg,#2b3140,#11141a)] text-[18px] font-semibold tracking-[0.02em] text-white">
                  {initials(me.name)}
                </AvatarFallback>
                <span aria-hidden className="absolute bottom-[9px] left-1/2 -ml-[11px] h-0.5 w-[22px] rounded-full bg-[#6f95ff]" />
              </>
            )}
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto min-w-52">
          {me.role === "ADMIN" && (
            <DropdownMenuItem className="min-h-11 px-3 text-[15px]" render={<Link href="/admin" />}>
              <SettingsIcon />
              Администрирование
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="min-h-11 px-3 text-[15px]" onClick={() => setPicking(true)}>
            <UserRoundPenIcon />
            Сменить портрет
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11 px-3 text-[15px]" onClick={() => void logout()}>
            <LogOutIcon />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-[19px] font-semibold tracking-[-0.015em]">{me.name}</span>
        {progress && <span className="text-sm font-medium text-primary-text">{progress.level.title}</span>}
        {crew && <span className="text-[13px] text-muted-foreground">{crew}</span>}
      </div>

      <NotificationsBell unread={unread} />
      <PortraitPicker open={picking} onOpenChange={setPicking} name={me.name} current={portrait?.id ?? null} />
    </header>
  );
}

// Круглая стеклянная кнопка 44×44
const BELL =
  "relative flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

// Колокольчик открывает уведомления, а когда они открыты — подсвечен и закрывает их
function NotificationsBell({ unread }: { unread: number }) {
  const open = usePathname() === "/notifications";
  const close = useCloseNotifications();

  if (open) {
    return (
      <button
        type="button"
        onClick={close}
        aria-label="Закрыть уведомления"
        aria-pressed
        className={cn(BELL, "border border-primary-soft-border bg-primary-soft text-primary-text transition-colors hover:border-primary")}
      >
        <BellIcon className="size-5" />
      </button>
    );
  }
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Уведомления: непрочитанных ${unread}` : "Уведомления"}
      className={cn(BELL, "glass glass-press")}
    >
      <BellIcon className="size-5" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-white shadow-[0_0_0_2px_var(--background)]">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
