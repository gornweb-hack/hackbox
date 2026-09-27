import { Button } from "@/components/ui/button";
import { type Action, ACTIONS, type Round } from "@/games/boarding/rules";

export const ACTION_ORDER: Action[] = ["board", "refuse", "passport", "carrier", "fold", "chief"];

// Кнопки действий. Те, что понадобятся в следующих рейсах, видны сразу, но закрыты — как правила в памятке
export function ActionPad({ round, disabled, onAct }: { round: Round; disabled: boolean; onAct: (action: Action) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ACTION_ORDER.map((action) => {
        const { label, round: opens } = ACTIONS[action];
        const locked = opens > round;
        return (
          <Button
            key={action}
            variant={action === "board" ? "default" : "outline"}
            disabled={disabled || locked}
            onClick={() => onAct(action)}
            className="h-14 flex-col gap-0 px-2 text-[15px] leading-tight whitespace-normal"
          >
            {label}
            {locked && <span className="text-[11px] font-normal text-muted-foreground">с рейса {opens}</span>}
          </Button>
        );
      })}
    </div>
  );
}
