"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useModuleStatus } from "@/lib/modules";

// Блок модуля показывается, только пока модуль жив. Упал — вместо блока заглушка,
// остальная страница работает. Статус обновляется сразу по SSE module.status
export function ModuleGate({
  name,
  children,
  fallback,
}: {
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const status = useModuleStatus(name);
  if (status === "unknown") return <Skeleton className="h-24 w-full" />;
  if (status === "down") {
    return (
      fallback ?? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Раздел временно недоступен. Остальное работает, попробуйте чуть позже.
        </div>
      )
    );
  }
  return children;
}
