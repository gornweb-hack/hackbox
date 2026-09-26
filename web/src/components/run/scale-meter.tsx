import { ArrowDownIcon, ArrowUpIcon, ShieldIcon, SmileIcon } from "lucide-react";
import { formatDelta, SCALE_TITLES, type ScaleName, zoneOf } from "@/lib/scales";
import { cn } from "@/lib/utils";

const ICONS = { loyalty: SmileIcon, safety: ShieldIcon };
const TONES = { red: "bg-zone-red", yellow: "bg-zone-yellow", green: "bg-zone-green" };

// Шкала по макету (блок «Репутация»): иконка, название, зона, значение, полоса с зонами.
// Смысл не передаётся одним цветом — у шкалы есть иконка, подпись зоны и число
export function ScaleMeter({ scale, value, delta }: { scale: ScaleName; value: number; delta?: number }) {
  const Icon = ICONS[scale];
  const zone = zoneOf(value);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-medium">{SCALE_TITLES[scale]}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className={cn("size-2 shrink-0 rounded-full", TONES[zone.tone])} />
            {zone.label}
          </span>
        </div>
        <div className="flex flex-col items-end gap-[3px]">
          <span className="text-[28px] leading-none font-semibold tracking-[-0.025em]">{value}</span>
          {delta ? (
            <span className="flex items-center gap-[3px] text-xs whitespace-nowrap text-muted-foreground">
              {delta > 0 ? <ArrowUpIcon className="size-3.5 text-foreground" /> : <ArrowDownIcon className="size-3.5 text-foreground" />}
              {formatDelta(delta)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-[5px]">
        <div
          role="meter"
          aria-label={SCALE_TITLES[scale]}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-2 overflow-hidden rounded-full bg-track"
        >
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 motion-reduce:transition-none", TONES[zone.tone])}
            style={{ width: `${value}%` }}
          />
          <div className="absolute inset-y-0 left-[30%] w-0.5 bg-card" />
          <div className="absolute inset-y-0 left-[60%] w-0.5 bg-card" />
        </div>
        <div aria-hidden className="grid grid-cols-[30fr_30fr_40fr] gap-0.5">
          <span className="h-[3px] rounded-sm bg-zone-red opacity-60" />
          <span className="h-[3px] rounded-sm bg-zone-yellow opacity-60" />
          <span className="h-[3px] rounded-sm bg-zone-green opacity-60" />
        </div>
        <div aria-hidden className="relative h-3.5 text-[11px] text-muted-foreground">
          <span className="absolute left-0">0</span>
          <span className="absolute left-[30%] -translate-x-1/2">30</span>
          <span className="absolute left-[60%] -translate-x-1/2">60</span>
          <span className="absolute right-0">100</span>
        </div>
      </div>
    </div>
  );
}
