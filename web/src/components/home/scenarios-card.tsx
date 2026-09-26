import { groupByCategory, type Scenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// «Сценарии» на главной (в макете — «Методички»): сколько пройдено всего и по категориям
export function ScenariosCard({ scenarios, className }: { scenarios: Scenario[]; className?: string }) {
  const done = scenarios.filter((scenario) => scenario.completed).length;

  return (
    <HomeCard title="Сценарии" href="/scenarios" linkLabel="Каталог" className={className}>
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] text-muted-foreground">Пройдено</span>
        <span className="text-[40px] leading-none font-semibold tracking-[-0.035em]">{done}</span>
        <span className="text-lg text-muted-foreground">из {scenarios.length}</span>
      </div>
      <Segments total={scenarios.length} done={done} className="h-1.5" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-6 gap-y-3.5">
        {groupByCategory(scenarios).map((group) => {
          const groupDone = group.items.filter((scenario) => scenario.completed).length;
          return (
            <div key={group.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-2 text-sm">
                <span>{group.title}</span>
                <span className="font-semibold">
                  {groupDone}/{group.items.length}
                </span>
              </div>
              <Segments total={group.items.length} done={groupDone} className="h-1" />
            </div>
          );
        })}
      </div>
    </HomeCard>
  );
}

// Полоса из сегментов: пройденные — синие. Число рядом уже передаёт смысл, поэтому для скринридера она скрыта
function Segments({ total, done, className }: { total: number; done: number; className: string }) {
  return (
    <div aria-hidden className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={cn("rounded-full", className, index < done ? "bg-primary" : "bg-track")} />
      ))}
    </div>
  );
}
