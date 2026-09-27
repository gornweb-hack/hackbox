"use client";

import { Button } from "@/components/ui/button";
import { type BoardingState, LAST_ROUND } from "@/games/boarding/flow";
import { ACTIONS, CASES, LATE, PASSENGER_LOOKS, type Result, TRAIN } from "@/games/boarding/rules";
import { ActionPad } from "./action-pad";
import { Briefing } from "./briefing";
import { Documents, formatDay } from "./documents";
import { Feedback, type FeedbackCard } from "./feedback";
import { type Figure, figureOf, Platform } from "./platform";
import { useBoarding } from "./use-boarding";

const LATE_LINE = "Подождите! Откройте, пожалуйста, я успею, у меня билет!";

// Мини-игра «Посадка»: шапка рейса, платформа с пассажиром, билет и паспорт, кнопки действий.
// Что верно — решает games/boarding/rules.ts, ход игры — games/boarding/flow.ts, здесь только экран
export function BoardingGame({ onFinish }: { onFinish: (result: Result) => void }) {
  const { state, start, act, next, late, finish } = useBoarding(onFinish);
  const { phase, round, current } = state;
  const atDoor = phase === "passenger" || phase === "feedback";
  const lateScene = phase === "late" || phase === "lateFeedback";
  const card = feedbackCard(state);

  return (
    <div className="relative mx-auto flex w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border bg-background shadow-card">
      <header className="flex items-start justify-between gap-3 bg-hero px-4 py-3 text-white">
        <div className="flex flex-col">
          <span className="text-[17px] font-semibold">
            Рейс {round} из {LAST_ROUND}
          </span>
          <span className="text-[13px] text-[#b9c0cc]">
            Поезд {TRAIN.time} · вагон {TRAIN.car}
            {phase !== "briefing" && ` · сегодня ${formatDay(0)}`}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={state.secondsLeft <= 10 && atDoor ? "font-mono text-2xl font-bold text-[#ff6b6b]" : "font-mono text-2xl font-bold text-amber"}>
            {Math.floor(state.secondsLeft / 60)}:{String(state.secondsLeft % 60).padStart(2, "0")}
          </span>
          <span className="text-[13px] whitespace-nowrap text-[#b9c0cc]">
            Очки {state.decisions.reduce((sum, decision) => sum + decision.points, 0)} · очередь {state.queue.length}
          </span>
        </div>
      </header>

      <Platform line={lineOf(state)} figure={figureFor(state)} queue={atDoor ? state.queue : []} doorsClosed={!atDoor} />
      <Documents passenger={atDoor ? current : null} reveal={phase === "feedback"} />

      <div className="min-h-[236px] p-3">
        {card ? (
          <Feedback card={card} onNext={phase === "lateFeedback" ? finish : next} />
        ) : lateScene ? (
          <div className="flex flex-col gap-2">
            <p className="py-2 text-center text-[15px]">Двери уже закрыты. Поезд отправляется по расписанию.</p>
            <Button variant="outline" onClick={() => late(true)} className="h-14 text-[15px]">
              Открыть двери
            </Button>
            <Button variant="outline" onClick={() => late(false)} className="h-14 text-[15px]">
              Не открывать
            </Button>
          </div>
        ) : (
          <ActionPad round={round} disabled={phase !== "passenger"} onAct={act} />
        )}
      </div>

      {phase === "briefing" && <Briefing round={round} onStart={start} />}
    </div>
  );
}

function lineOf(state: BoardingState) {
  if ((state.phase === "passenger" || state.phase === "feedback") && state.current) return state.current.line;
  if (state.phase === "late" || state.phase === "lateFeedback") return LATE_LINE;
  if (state.phase === "closing") return "Двери закрываются. Поезд отправляется.";
  if (state.phase === "done") return "Поезд отправился. Итоги смены — ниже.";
  return "Скоро посадка: пассажиры собираются на платформе.";
}

function figureFor(state: BoardingState): Figure | null {
  if ((state.phase === "passenger" || state.phase === "feedback") && state.current) return figureOf(state.current, String(state.served));
  if (state.phase === "late" || state.phase === "lateFeedback") {
    // Опоздавший — любой из персонажей; выбор без случайности, чтобы экран не менялся при перерисовке
    const look = PASSENGER_LOOKS[state.decisions.length % PASSENGER_LOOKS.length];
    return { key: "late", look, emotion: "worried", carry: null, drunk: false };
  }
  return null;
}

function feedbackCard(state: BoardingState): FeedbackCard | null {
  const last = state.decisions.at(-1);
  if (state.phase === "feedback" && last) {
    const rule = CASES[last.passenger.kind];
    return {
      verdict: last.verdict,
      situation: `${rule.memo ? `Памятка, №${rule.memo} · ` : ""}${rule.title}`,
      correct: ACTIONS[rule.correct].label,
      phrase: rule.phrase,
      rule: rule.rule,
    };
  }
  if (state.phase === "lateFeedback") {
    return {
      verdict: state.lateOpened ? "wrong" : "correct",
      situation: `Памятка, №${LATE.memo} · ${LATE.title}`,
      correct: "Не открывать двери",
      phrase: LATE.phrase,
      rule: LATE.rule,
    };
  }
  return null;
}
