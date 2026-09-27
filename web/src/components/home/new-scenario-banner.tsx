import { ChevronRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import type { Scenario } from "@/lib/scenarios";

// Плашка над главной карточкой: в каталоге появился новый сценарий
export function NewScenarioBanner({ scenario }: { scenario: Scenario }) {
  return (
    <Link
      href={`/scenarios/${scenario.id}`}
      className="glass glass-press relative flex min-h-[46px] items-center gap-2.5 rounded-full px-4 text-sm font-medium text-primary-text outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <SparklesIcon className="size-[18px] shrink-0" />
      <span className="min-w-0 flex-1">Новый сценарий: «{scenario.title}»</span>
      <ChevronRightIcon className="size-4 shrink-0" />
    </Link>
  );
}
