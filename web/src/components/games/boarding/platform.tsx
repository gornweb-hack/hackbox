"use client";

import { useEffect, useRef } from "react";
import { Bust } from "@/components/run/novel/bust";
import { type Emotion, Head, LOOKS } from "@/components/run/scene/head";
import type { Carry, Passenger, PassengerLook } from "@/games/boarding/rules";
import { TRAIN } from "@/games/boarding/rules";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

// Платформа у двери вагона: очередь, пассажир у двери (персонажи сценариев, векторный SVG),
// что у него с собой и двери, которые закрываются в конце рейса. Цвета — рисунок, а не токены

// Цвет одежды закреплён за внешностью: так пассажира легко узнать в очереди и у двери
const COATS: Record<PassengerLook, string> = {
  man: "#4f6284",
  woman: "#b0506e",
  redhead: "#5e8f6a",
  elder: "#7a7f87",
  neighbour: "#a8462f",
};

export interface Figure {
  // Меняется у каждого нового пассажира — по нему срабатывает анимация подхода
  key: string;
  look: PassengerLook;
  emotion: Emotion;
  carry: Carry | null;
  drunk: boolean;
}

export function figureOf(passenger: Passenger, key: string): Figure {
  const worried = passenger.kind === "deadPhone" || (passenger.kind === "noDocument" && passenger.document === null);
  const emotion = passenger.drunk || passenger.kind === "parcel" ? "smile" : worried ? "worried" : "calm";
  return { key, look: passenger.look, emotion, carry: passenger.carry, drunk: passenger.drunk };
}

export function Platform({ line, figure, queue, doorsClosed }: { line: string; figure: Figure | null; queue: Passenger[]; doorsClosed: boolean }) {
  const visible = queue.slice(0, 4);
  return (
    <div className="flex flex-col">
      <p className="relative mx-3 mt-3 min-h-[62px] rounded-xl border bg-card px-4 py-2.5 text-[15px] leading-snug shadow-card">{line}</p>
      <div className="relative h-[196px] overflow-hidden bg-[#eef1f5]">
        {/* Край платформы: жёлтая линия безопасности */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-[#c5cbd4]" />
        <div className="absolute inset-x-0 bottom-4 h-[3px] bg-[#ffb020]" />

        <div className="absolute bottom-4 left-2 flex flex-row-reverse items-end">
          {visible.map((passenger, index) => (
            <svg key={index} viewBox="44 40 112 156" className="-ml-2 h-11 w-auto" style={{ opacity: 1 - index * 0.15 }} aria-hidden>
              <Head look={LOOKS[passenger.look]} emotion="calm" x={100} bottom={190} height={110} />
            </svg>
          ))}
        </div>
        {queue.length > visible.length && <span className="absolute top-2 left-3 text-[13px] text-muted-foreground">+{queue.length - visible.length}</span>}

        {figure && <Person key={figure.key} figure={figure} />}

        <Car closed={doorsClosed} />
      </div>
    </div>
  );
}

function Person({ figure }: { figure: Figure }) {
  const bust = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Признаки опьянения видно по походке: пассажира покачивает
  useEffect(() => {
    if (!figure.drunk || reduced || !bust.current) return;
    const animation = bust.current.animate([{ transform: "rotate(-4deg)" }, { transform: "rotate(4deg)" }], {
      duration: 650,
      iterations: Infinity,
      direction: "alternate",
      easing: "ease-in-out",
    });
    return () => animation.cancel();
  }, [figure.drunk, reduced]);

  const inHands = figure.carry === "pet" || figure.carry === "parcel";
  return (
    <div className="absolute inset-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-40 motion-safe:duration-300">
      <div className="absolute bottom-3 left-[34%] w-[132px] -translate-x-1/2">
        <div ref={bust} className="origin-bottom">
          <Bust look={LOOKS[figure.look]} coat={COATS[figure.look]} emotion={figure.emotion} />
        </div>
        {inHands && figure.carry && (
          <div className="absolute bottom-1 left-1/2 w-[76px] -translate-x-1/3">
            <CarryArt carry={figure.carry} />
          </div>
        )}
      </div>
      {!inHands && figure.carry && (
        <div className="absolute bottom-5 left-[53%] w-[88px]">
          <CarryArt carry={figure.carry} />
        </div>
      )}
    </div>
  );
}

// Что при пассажире. Питомец в переноске и сложенный велосипед — обманки: с ними всё в порядке
function CarryArt({ carry }: { carry: Carry }) {
  switch (carry) {
    case "pet":
      return (
        <svg viewBox="0 0 76 44" aria-label="Питомец на руках, без переноски">
          <ellipse cx="30" cy="28" rx="27" ry="14" fill="#9a6a3c" />
          <circle cx="60" cy="16" r="13" fill="#9a6a3c" />
          <ellipse cx="53" cy="8" rx="5" ry="9" fill="#6e4a28" />
          <circle cx="64" cy="13" r="2" fill="#15171c" />
          <circle cx="72" cy="19" r="3" fill="#15171c" />
        </svg>
      );
    case "petInCarrier":
      return (
        <svg viewBox="0 0 80 72" aria-label="Питомец в переноске">
          <rect x="28" y="2" width="24" height="10" rx="3" fill="#2f3b4a" />
          <rect x="2" y="12" width="76" height="58" rx="10" fill="#4f6284" />
          <rect x="20" y="22" width="40" height="38" rx="6" fill="#dfe3ea" />
          <circle cx="40" cy="42" r="12" fill="#9a6a3c" />
          <path d="M30 22 V60 M40 22 V60 M50 22 V60" stroke="#4f6284" strokeWidth="3" />
        </svg>
      );
    case "bike":
      return (
        <svg viewBox="0 0 100 66" aria-label="Велосипед в собранном виде" fill="none" strokeWidth="4" strokeLinecap="round">
          <circle cx="22" cy="42" r="20" stroke="#2f3b4a" />
          <circle cx="78" cy="42" r="20" stroke="#2f3b4a" />
          <path d="M22 42 L46 16 L78 42 M22 42 H64 L46 16" stroke="#d63b3b" />
          <path d="M72 10 L78 42 M64 10 H82" stroke="#2f3b4a" />
        </svg>
      );
    case "bikeFolded":
      return (
        <svg viewBox="0 0 70 70" aria-label="Сложенный велосипед в чехле">
          <rect x="4" y="4" width="62" height="62" rx="14" fill="#2f3b4a" />
          <circle cx="30" cy="36" r="17" fill="none" stroke="#6d7a8c" strokeWidth="3" />
          <circle cx="42" cy="36" r="17" fill="none" stroke="#6d7a8c" strokeWidth="3" />
          <rect x="4" y="33" width="62" height="4" fill="#ffb020" />
        </svg>
      );
    case "parcel":
      return (
        <svg viewBox="0 0 60 44" aria-label="Коробка-посылка">
          <rect x="2" y="2" width="56" height="40" fill="#c9a877" />
          <rect x="2" y="18" width="56" height="6" fill="#a88a5a" />
          <rect x="27" y="2" width="6" height="40" fill="#a88a5a" />
        </svg>
      );
  }
}

// Вагон с дверью: створки разъезжаются, когда рейс идёт, и съезжаются, когда поезд отправляется
function Car({ closed }: { closed: boolean }) {
  return (
    <div className="absolute top-4 right-0 bottom-4 w-[24%] border-l border-[#c5cbd4] bg-white">
      <div className="absolute inset-x-0 top-3 h-2 bg-primary" />
      <span className="absolute inset-x-0 top-6 text-center text-[11px] text-muted-foreground">Вагон {TRAIN.car}</span>
      <div className="absolute inset-x-[14%] top-11 bottom-0 overflow-hidden bg-[#2a2f38]">
        <div className={cn("absolute inset-y-0 left-0 w-1/2 border-r border-[#c5cbd4] bg-[#dfe3ea] transition-transform duration-700", !closed && "-translate-x-full")} />
        <div className={cn("absolute inset-y-0 right-0 w-1/2 border-l border-[#c5cbd4] bg-[#dfe3ea] transition-transform duration-700", !closed && "translate-x-full")} />
      </div>
    </div>
  );
}
