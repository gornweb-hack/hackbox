import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Карточка главной по макету: шапка — ссылка на раздел во всю ширину, ниже содержимое
export function HomeCard({
  title,
  href,
  linkLabel,
  className,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5 shadow-card", className)}>
      <Link
        href={href}
        className="-mx-2.5 -mt-3 -mb-2 flex min-h-11 items-center justify-between gap-2 rounded-md px-2.5 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
      >
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        <span className="flex items-center gap-0.5 text-[13px] text-muted-foreground">
          {linkLabel}
          <ChevronRightIcon className="size-4" />
        </span>
      </Link>
      {children}
    </section>
  );
}
