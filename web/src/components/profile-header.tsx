"use client";

import { BellIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Me, useLogout } from "@/lib/auth";
import type { ProfileSummary } from "@/lib/demo";

const plural = new Intl.PluralRules("ru-RU");

// «Екатерина Волкова» → «ЕВ», «Демо-сотрудник» → «ДС»
function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

// Шапка над содержимым: кто вошёл, его уровень и бригада, уведомления.
// Выход и администрирование в макете не предусмотрены — они в меню по нажатию на аватар
export function ProfileHeader({ me, profile }: { me: Me; profile: ProfileSummary }) {
  const logout = useLogout();
  const bellLabel =
    profile.unread > 0
      ? `Уведомления: ${profile.unread} ${plural.select(profile.unread) === "one" ? "новое" : "новых"}`
      : "Уведомления";

  return (
    <header className="flex items-center gap-3.5 px-1 pt-2 pb-2.5 lg:p-0 lg:pb-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Меню профиля"
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          {/* Кольцо: зазор цвета фона, затем тонкая синяя обводка */}
          <Avatar className="size-14 shadow-[0_0_0_2px_var(--background),0_0_0_3.5px_var(--primary)] after:hidden">
            <AvatarFallback className="bg-[linear-gradient(160deg,#2b3140,#11141a)] text-[18px] font-semibold tracking-[0.02em] text-white">
              {initials(me.name)}
            </AvatarFallback>
            <span aria-hidden className="absolute bottom-[9px] left-1/2 -ml-[11px] h-0.5 w-[22px] rounded-full bg-[#6f95ff]" />
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto min-w-52">
          {me.role === "ADMIN" && (
            <DropdownMenuItem className="min-h-11 px-3 text-[15px]" render={<Link href="/admin" />}>
              <SettingsIcon />
              Администрирование
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="min-h-11 px-3 text-[15px]" onClick={() => void logout()}>
            <LogOutIcon />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-[19px] font-semibold tracking-[-0.015em]">{me.name}</span>
        <span className="text-sm font-medium text-primary-text">{profile.title}</span>
        <span className="text-[13px] text-muted-foreground">{profile.crew}</span>
      </div>

      <Link
        href="/notifications"
        aria-label={bellLabel}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-lg border bg-card transition-colors outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:bg-muted"
      >
        <BellIcon className="size-5" />
        {profile.unread > 0 && (
          <span className="absolute -top-[5px] -right-[5px] flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-primary px-[5px] text-xs font-semibold text-primary-foreground shadow-[0_0_0_2px_var(--background)]">
            {profile.unread}
          </span>
        )}
      </Link>
    </header>
  );
}
