"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { hasNovel } from "@/components/run/novel/cast";
import { NovelPlayer } from "@/components/run/novel/novel-player";
import { RunPlayer } from "@/components/run/run-player";
import { RunReport } from "@/components/run/run-report";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useRun } from "@/lib/runs";
import { cn } from "@/lib/utils";

// Прохождение по адресу: пока идёт — плеер, после финала — разбор. Перезагрузка продолжает с того же места
export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const { data: run, isPending, error } = useRun(runId);

  if (isPending) return <Skeleton className="mx-auto h-96 w-full max-w-3xl rounded-xl" />;
  // При перечитывании React Query оставляет прежние данные рядом с ошибкой. Если сценарий поправили
  // или прохождения больше нет, прежний узел показывать нельзя — показываем ошибку
  const gone = error instanceof ApiError && (error.code === "SCENARIO_CHANGED" || error.status === 404);
  if (!run || gone) {
    const message =
      error instanceof ApiError && error.code === "SCENARIO_CHANGED"
        ? "Сценарий изменили, пока вы его проходили. Начните его заново."
        : error instanceof ApiError && error.status === 404
          ? "Прохождение не найдено."
          : "Не удалось загрузить прохождение. Обновите страницу чуть позже.";
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link href="/scenarios" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-[15px]")}>
          Все сценарии
        </Link>
      </div>
    );
  }

  if (run.status === "finished") return <RunReport run={run} />;
  // Сценарий с постановкой новеллы играется в ней, остальные — в обычном плеере
  return hasNovel(run.scenarioId) ? <NovelPlayer run={run} /> : <RunPlayer run={run} />;
}
