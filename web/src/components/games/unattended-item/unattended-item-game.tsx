"use client";

import { ScreenFlash } from "@/components/run/screen-flash";
import { Button } from "@/components/ui/button";
import { ITEMS, type Result } from "@/games/unattended-item/rules";
import { cn } from "@/lib/utils";
import { ActionList } from "./action-list";
import { CarView } from "./car";
import { Dialog, Sheet } from "./dialog";
import { useInspection } from "./use-inspection";

// Мини-игра «Бесхозная вещь»: шапка с таймером, вагон сверху и шторки поверх него — вводная,
// диалоги и выбор действий. Что верно — решает games/unattended-item/rules.ts,
// ход игры — games/unattended-item/flow.ts, расстановка — layout.ts; здесь только экран
export function UnattendedItemGame({ onFinish }: { onFinish: (result: Result) => void }) {
  const { car, state, dispatch, y, bubble, reported, walk, inspectItem, inspectBag } = useInspection(onFinish);
  const { phase, secondsLeft } = state;
  const clue = ITEMS[car.kind].clue;

  return (
    <div className="relative mx-auto flex w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border bg-background shadow-card">
      {state.alarms > 0 && <ScreenFlash key={state.alarms} tone="bad" />}
      <header className="flex items-start justify-between gap-3 bg-hero px-4 py-3 text-white">
        <div className="flex min-w-0 flex-col">
          <span className="text-[17px] font-semibold">Осмотр салона · вагон 5</span>
          <span aria-live="polite" className="text-[13px] text-[#b9c0cc]">
            {state.hint}
          </span>
        </div>
        <span className={cn("font-mono text-2xl font-semibold", secondsLeft <= 10 && phase === "search" ? "text-[#ff6b6b]" : "text-amber")}>
          0:{String(Math.max(0, secondsLeft)).padStart(2, "0")}
        </span>
      </header>

      <CarView car={car} state={state} y={y} bubble={bubble} onWalk={walk} onItem={inspectItem} onBag={inspectBag} />

      {phase === "intro" && (
        <Sheet>
          <h2 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">Бесхозная вещь</h2>
          <p className="text-[15px] leading-snug">Пассажиры сообщают: в салоне оставлена чья-то вещь.</p>
          <p className="text-[15px] leading-snug">
            Найдите её и решите, что делать. Правильный ответ зависит от того, что это за вещь. На осмотр — 45 секунд.
          </p>
          <Button size="xl" onClick={() => dispatch({ type: "start" })}>
            Начать осмотр
          </Button>
        </Sheet>
      )}

      {phase === "tea" && (
        <Dialog
          speaker="tea"
          phrase="Проводник, принесите, пожалуйста, чай!"
          options={[
            { label: "«Минуту, я закончу осмотр салона и подойду к вам»", onPick: () => dispatch({ type: "teaAnswer", choice: "polite" }) },
            { label: "Сходить за чаем, осмотр подождёт", onPick: () => dispatch({ type: "teaAnswer", choice: "serve" }) },
            { label: "Пройти мимо молча", onPick: () => dispatch({ type: "teaAnswer", choice: "ignore" }) },
          ]}
        />
      )}

      {phase === "clue" && clue && (
        <Dialog speaker={clue.speaker} phrase={clue.text} options={[{ label: "Понятно", onPick: () => dispatch({ type: "clueDone" }) }]} />
      )}

      {phase === "grab" && (
        <Dialog
          speaker="grabber"
          phrase="Да я сам её в тамбур вынесу, чего ждать!"
          options={[
            { label: "«Пожалуйста, не трогайте вещь — мы уточним, чья она»", onPick: () => dispatch({ type: "grabAnswer", choice: "stop" }) },
            { label: "Пусть выносит, раз хочет", onPick: () => dispatch({ type: "grabAnswer", choice: "allow" }) },
          ]}
        />
      )}

      {/* После итога выбор ещё виден до разбора — видно, какое действие всё решило */}
      {(phase === "actions" || (phase === "over" && state.found && state.actions.length > 0 && !reported)) && (
        <ActionList kind={car.kind} chosen={state.actions} onAct={(action) => dispatch({ type: "act", action })} />
      )}
    </div>
  );
}
