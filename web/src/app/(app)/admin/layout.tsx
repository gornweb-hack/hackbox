"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMe } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
      <nav className="-mx-4 flex gap-1 overflow-x-auto border-b px-4">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground",
              pathname === tab.href && "border-foreground font-medium text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
