"use client";

import { PlayIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackLink } from "@/components/back-link";
import { CarScene } from "@/components/run/car-scene";
import { ScenarioTags } from "@/components/scenario-tags";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartRun } from "@/lib/runs";
import { SCALE_TITLES } from "@/lib/scales";
import { useScenarios } from "@/lib/scenarios";

// Вступление к сценарию: о чём он, как устроена механика, и старт прохождения
export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: scenarios, isPending, isError } = useScenarios();
  const start = useStartRun();
  const scenario = scenarios?.find((item) => item.id === id);

  if (isPending) return <Skeleton className="mx-auto h-80 w-full max-w-3xl rounded-xl" />;
  if (isError || !scenario) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          {isError ? "Каталог сценариев недоступен. Обновите страницу чуть позже." : "Сценарий не найден."}
        </p>
        <Link href="/scenarios" className={buttonVariants({ variant: "outline" })}>
          Все сценарии
        </Link>
      </div>
    );
  }

  const begin = () =>
    start.mutate(scenario.id, {
      onSuccess: (run) => router.push(`/scenarios/runs/${run.id}`),
      onError: (error) => toast.error(error.message),
    });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <BackLink href="/scenarios">Сценарии</BackLink>
      <section className="glass-dark relative flex flex-col gap-4 rounded-2xl px-[22px] pt-6 pb-[22px]">
        <span className="text-[13px] font-medium text-[#93b2ff]">{scenario.category.title}</span>
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-white lg:text-[34px]">
            {scenario.title}
          </h1>
          <p className="text-[15px] leading-[1.45] text-pretty text-[#b9c0cc]">{scenario.summary}</p>
        </div>
        <ScenarioTags scenario={scenario} tone="dark" withCategory={false} />
      </section>

      {/* Пока человек читает, как устроен сценарий, проводник катит тележку по вагону */}
      <CarScene scenarioId={scenario.id} walkMs={9000} />

      <section className="glass relative flex flex-col gap-2 rounded-xl p-5 text-[15px] leading-[1.5]">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Как это устроено</h2>
        <p>
          Каждое решение по-разному двигает две шкалы — «{SCALE_TITLES.loyalty}» и «{SCALE_TITLES.safety}». Исход
          зависит от выбранного пути.
        </p>
        {scenario.hasTimers && (
          <p>В критические моменты идёт таймер: если не успеть, ситуация развивается без вас.</p>
        )}
        <p>После финала — разбор каждого решения: что повлияло на шкалы и как можно было лучше.</p>
        {scenario.completed && (
          <p className="text-muted-foreground">Вы уже проходили этот сценарий — попробуйте улучшить результат.</p>
        )}
      </section>

      <Button
        onClick={begin}
        disabled={start.isPending}
        size="xl"
        className="sm:min-w-[200px] sm:self-start"
      >
        <PlayIcon className="size-[18px] fill-current" />
        Начать прохождение
      </Button>
    </div>
  );
}
