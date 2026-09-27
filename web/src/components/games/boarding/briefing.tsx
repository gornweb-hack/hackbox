import { Button } from "@/components/ui/button";
import { LAST_ROUND } from "@/games/boarding/flow";
import { ACTIONS, CASES, LATE, type Round, ROUNDS } from "@/games/boarding/rules";
import { ACTION_ORDER } from "./action-pad";

// Правила рейса перед его началом: какие ситуации памятки добавились и какие кнопки открылись
export function Briefing({ round, onStart }: { round: Round; onStart: () => void }) {
  const rules = [...Object.values(CASES).filter((rule) => rule.round === round), ...(round === LATE.round ? [LATE] : [])];
  const opened = ACTION_ORDER.filter((action) => ACTIONS[action].round === round).map((action) => `«${ACTIONS[action].label}»`);

  return (
    <div className="absolute inset-0 z-10 flex items-start justify-center overflow-y-auto bg-black/55 p-3 motion-safe:animate-in motion-safe:fade-in">
      <section className="flex w-full flex-col gap-3 rounded-2xl bg-card p-5 shadow-card">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">
            Рейс {round} из {LAST_ROUND}
          </h2>
          <span className="text-sm text-muted-foreground">
            {ROUNDS[round].passengers} пассажиров · {ROUNDS[round].seconds} секунд до отправления
          </span>
        </div>
        {round === 1 && (
          <p className="text-[15px] leading-snug">
            Биометрия у двери не сработала — проверяйте пассажиров вручную по памятке. Пока открыт разбор решения, часы стоят.
          </p>
        )}
        <h3 className="text-[13px] font-semibold text-muted-foreground">Новые правила</h3>
        <ul className="flex flex-col gap-2.5">
          {rules.map((rule) => (
            <li key={rule.title} className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{rule.title}</span>
              <span className="text-sm leading-snug text-muted-foreground">{rule.rule}</span>
            </li>
          ))}
        </ul>
        {opened.length > 0 && <p className="text-sm">Новые кнопки: {opened.join(", ")}</p>}
        <Button onClick={onStart} className="h-12 text-[15px]">
          {round === 1 ? "Начать посадку" : "Следующий рейс"}
        </Button>
      </section>
    </div>
  );
}
