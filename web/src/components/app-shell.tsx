"use client";

import { LogOutIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { type Me, type Role, ROLE_LABELS, useLogout, useMe } from "@/lib/auth";
import { EventStreamProvider } from "@/lib/events";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  roles?: Role[];
}

// Пункты меню; roles — кому пункт виден
const NAV: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/admin", label: "Администрирование", roles: ["ADMIN"] },
];

// Каркас для вошедших: шапка с меню по ролям, выход, одно SSE-подключение на всё приложение
export function AppShell({ children }: { children: ReactNode }) {
  const { data: me, isPending, isError } = useMe();

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
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

  const items = NAV.filter((item) => !item.roles || item.roles.includes(me.role));
  return (
    <EventStreamProvider>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <MobileNav items={items} me={me} />
          <Link href="/" className="font-semibold">
            hackbox
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <UserBadge me={me} className="hidden sm:flex" />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4">{children}</main>
    </EventStreamProvider>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        isActive(pathname, item.href) && "bg-muted font-medium text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

function UserBadge({ me, className }: { me: Me; className?: string }) {
  return (
    <div className={cn("items-center gap-2 text-sm", className)}>
      <span className="font-medium">{me.name}</span>
      <Badge variant="secondary">{ROLE_LABELS[me.role]}</Badge>
    </div>
  );
}

function LogoutButton() {
  const logout = useLogout();
  return (
    <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Выйти" title="Выйти">
      <LogOutIcon />
    </Button>
  );
}

// На телефоне — меню-гамбургер с боковой панелью
function MobileNav({ items, me }: { items: NavItem[]; me: Me }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Меню" />}>
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>hackbox</SheetTitle>
          <UserBadge me={me} className="flex" />
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {items.map((item) => (
            <NavLink key={item.href} item={item} onClick={() => setOpen(false)} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
