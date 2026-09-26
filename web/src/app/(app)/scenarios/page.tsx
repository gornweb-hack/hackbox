"use client";

import { ClockIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { classLabel, type Scenario, useScenarios } from "@/lib/scenarios";

// Каталог сценариев по категориям. Категории идут в порядке первого сценария в них
export default function ScenariosPage() {
  const { data: scenarios, isPending, isError } = useScenarios();

  const groups = new Map<string, { title: string; items: Scenario[] }>();
  for (const scenario of scenarios ?? []) {
    const group = groups.get(scenario.category.id) ?? { title: scenario.category.title, items: [] };
    group.items.push(scenario);
    groups.set(scenario.category.id, group);
  }

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
      ) : groups.size === 0 ? (
        <p className="text-sm text-muted-foreground">Сценариев пока нет.</p>
      ) : (
        [...groups].map(([id, group]) => (
          <section key={id} className="flex flex-col gap-3">
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
        {scenario.isNew && <Badge className="h-[18px] shrink-0 rounded-sm px-1.5 text-[11px] font-semibold">Новый</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">{scenario.summary}</p>
      <div className="mt-auto flex flex-wrap gap-1.5">
        <Badge variant="outline" className="h-7 px-2.5 text-[13px] font-normal text-muted-foreground">
          {classLabel(scenario.carClass)}
        </Badge>
        <Badge variant="outline" className="h-7 gap-1.5 px-2.5 text-[13px] font-normal text-muted-foreground [&>svg]:size-3.5!">
          <ClockIcon />~{scenario.durationMin} мин
        </Badge>
      </div>
    </Link>
  );
}
