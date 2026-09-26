"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { ScenarioTags } from "@/components/scenario-tags";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { groupByCategory, type Scenario, useScenarios } from "@/lib/scenarios";

// Каталог сценариев по категориям. Категории идут в порядке первого сценария в них
export default function ScenariosPage() {
  const { data: scenarios, isPending, isError } = useScenarios();
  const groups = groupByCategory(scenarios ?? []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Сценарии</h1>
        <p className="text-sm text-muted-foreground">Ситуации на борту и на посадке: решения на время, две шкалы и разбор после финала.</p>
      </div>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Каталог сценариев недоступен. Обновите страницу чуть позже.</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Сценариев пока нет.</p>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-3">
            <h2 className="text-base font-semibold tracking-[-0.01em]">{group.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <Link
      href={`/scenarios/${scenario.id}`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card transition-[border-color,box-shadow] outline-none hover:border-border-strong hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[.995]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-base font-semibold tracking-[-0.01em]">{scenario.title}</span>
        {scenario.isNew && !scenario.completed && (
          <Badge className="h-[18px] shrink-0 rounded-sm px-1.5 text-[11px] font-semibold">Новый</Badge>
        )}
        {scenario.completed && (
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary-text">
            <CheckIcon className="size-4" />
            Пройден
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{scenario.summary}</p>
      <div className="mt-auto">
        <ScenarioTags scenario={scenario} tone="light" withCategory={false} />
      </div>
    </Link>
  );
}
