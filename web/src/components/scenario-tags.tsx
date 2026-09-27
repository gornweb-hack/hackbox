import { ClockIcon, TimerIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { classLabel, type Scenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

const TONES = {
  // На тёмном стекле — полупрозрачные метки с бликом, на светлом — плашка внутри стекла
  dark: "glass-on-dark text-[#dde2ea]",
  light: "glass-inner border-border text-muted-foreground",
};

// Метки сценария: категория, класс вагона, длительность и «Есть решения на время»
export function ScenarioTags({
  scenario,
  tone,
  withCategory = true,
}: {
  scenario: Scenario;
  tone: keyof typeof TONES;
  withCategory?: boolean;
}) {
  const tag = (content: ReactNode) => (
    <Badge variant="outline" className={cn("h-7 gap-1.5 px-2.5 text-[13px] font-medium [&>svg]:size-3.5!", TONES[tone])}>
      {content}
    </Badge>
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {withCategory && tag(scenario.category.title)}
      {tag(classLabel(scenario.carClass))}
      {tag(
        <>
          <ClockIcon />~{scenario.durationMin} мин
        </>,
      )}
      {scenario.hasTimers &&
        tag(
          <>
            <TimerIcon />
            Есть решения на время
          </>,
        )}
    </div>
  );
}
