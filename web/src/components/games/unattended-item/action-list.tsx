import { useState } from "react";
import { shuffle } from "@/games/unattended-item/layout";
import { ACTION_TEXT, type ActionId, type ItemKind, ITEMS } from "@/games/unattended-item/rules";
import { cn } from "@/lib/utils";
import { Sheet } from "./dialog";

// Отметка выбранного действия: цвет зоны и подпись — цвет не единственный сигнал
const VERDICTS = {
  forbidden: { label: "нельзя", className: "border-zone-red/40 bg-zone-red-soft", tag: "text-zone-red" },
  excess: { label: "лишнее", className: "border-zone-yellow/50 bg-zone-yellow-soft", tag: "text-zone-yellow-text" },
  fine: { label: "по памятке", className: "border-zone-green/40 bg-zone-green-soft", tag: "text-zone-green" },
};

// Выбор действий: варианты этой находки в случайном порядке, выбранные нумеруются по порядку
export function ActionList({ kind, chosen, onAct }: { kind: ItemKind; chosen: ActionId[]; onAct: (action: ActionId) => void }) {
  const rule = ITEMS[kind];
  // Порядок перемешивается один раз на партию, а не на каждый рендер
  const [offered] = useState(() => shuffle(rule.offered));

  return (
    <Sheet>
      <h2 className="text-[17px] leading-snug font-semibold">{rule.title}. Ваши действия по порядку:</h2>
      <div className="flex flex-col gap-2">
        {offered.map((id) => {
          const index = chosen.indexOf(id);
          const verdict = index < 0 ? null : VERDICTS[rule.forbidden.includes(id) ? "forbidden" : id in rule.excess ? "excess" : "fine"];
          return (
            <button
              key={id}
              type="button"
              disabled={index >= 0}
              onClick={() => onAct(id)}
              className={cn(
                "flex min-h-[50px] items-start gap-2.5 rounded-lg border px-4 py-3 text-left text-[15px] leading-snug transition-[transform,border-color] duration-150 ease-(--ease-spring) outline-none focus-visible:ring-2 focus-visible:ring-primary",
                verdict ? verdict.className : "glass-inner border-border hover:border-white active:scale-[.985]",
              )}
            >
              {verdict && <span className="font-semibold">{index + 1}.</span>}
              <span className="flex-1">{ACTION_TEXT[id]}</span>
              {verdict && <span className={cn("shrink-0 text-[13px] font-semibold", verdict.tag)}>{verdict.label}</span>}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
