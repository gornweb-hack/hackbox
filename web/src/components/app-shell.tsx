"use client";

import { BookOpenIcon, HouseIcon, type LucideIcon, TrophyIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProfileHeader } from "@/components/profile-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/auth";
import { EventStreamProvider } from "@/lib/events";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Разделы тренажёра. Администрирование — в меню аватара (ProfileHeader)
const NAV: NavItem[] = [
  { href: "/", label: "Главная", icon: HouseIcon },
  { href: "/scenarios", label: "Сценарии", icon: BookOpenIcon },
  { href: "/rating", label: "Рейтинг", icon: TrophyIcon },
  { href: "/profile", label: "Профиль", icon: UserIcon },
];

// Каркас для вошедших: сайдбар на десктопе, нижняя навигация на телефоне,
// шапка профиля и одно SSE-подключение на всё приложение
export function AppShell({ children }: { children: ReactNode }) {
  const { data: me, isPending, isError } = useMe();

  if (isPending) {
    return (
      <div className="flex w-full flex-col gap-3 p-4 lg:p-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (isError || !me) {
    // Потерю сессии обрабатывает клиент API (переход на /login); здесь — сбой сети или ядра
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Не удалось загрузить данные. Проверьте связь и обновите страницу.
      </div>
    );
  }

  return (
    <EventStreamProvider>
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-7 lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">
            <ProfileHeader me={me} />
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </EventStreamProvider>
  );
}

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

function Sidebar() {
  const isActive = useActive();
  return (
    <aside className="sticky top-0 hidden h-svh w-[248px] shrink-0 flex-col gap-7 border-r bg-card px-4 py-7 lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-2.5">
        {/* Логотип — «след скорости»: три линии, короче и прозрачнее к хвосту */}
        <span aria-hidden className="flex w-[22px] flex-col items-end gap-[3px]">
          <span className="h-0.5 w-full rounded-full bg-primary" />
          <span className="h-0.5 w-[70%] rounded-full bg-primary opacity-60" />
          <span className="h-0.5 w-[45%] rounded-full bg-primary opacity-35" />
        </span>
        <span className="flex flex-col">
          <span className="text-[17px] font-semibold tracking-[-0.01em]">Рейс 400</span>
          <span className="text-xs text-muted-foreground">Тренажёр проводника</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted",
              "aria-[current=page]:bg-primary-soft aria-[current=page]:font-semibold aria-[current=page]:text-primary-text",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function BottomNav() {
  const isActive = useActive();
  return (
    <nav className="sticky bottom-0 z-40 grid grid-cols-4 border-t bg-card px-2 py-1.5 lg:hidden">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className="flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-muted-foreground active:bg-muted aria-[current=page]:font-semibold aria-[current=page]:text-primary-text"
        >
          <Icon className="size-[22px]" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
