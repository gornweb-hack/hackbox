"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMe } from "@/lib/auth";

const TABS = [
  { href: "/admin", label: "Состояние системы" },
  { href: "/admin/users", label: "Сотрудники" },
];

// Раздел только для ADMIN. Это удобство интерфейса: настоящие права проверяет ядро
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { data: me } = useMe();
  const pathname = usePathname();

  if (me?.role !== "ADMIN") {
    return (
      <Alert>
        <AlertTitle>Недостаточно прав</AlertTitle>
        <AlertDescription>Раздел доступен только администратору.</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Вкладки — сегментный переключатель системы: активная вкладка — белая «линза» */}
      <nav className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-seg-track p-1 shadow-[inset_0_1px_2px_rgb(15_28_60/.08)]">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={pathname === tab.href ? "page" : undefined}
            className="flex h-10 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow] duration-200 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:text-foreground aria-[current=page]:shadow-[inset_0_1px_0_#fff,0_0_0_.5px_rgb(15_28_60/.08),0_4px_12px_-4px_rgb(20_40_110/.28)]"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
