"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

// Сцена вагона над текстом ситуации: пока человек читает, проводник катит тележку по проходу.
// Сцена общая для всех сценариев, поэтому пассажиры в ней нейтральные — ситуацию описывает текст.
// walkMs — сколько идёт проводник (0 — сразу стоит на месте); alarm — пульсирующая тревога, когда
// время на решение кончается; shakeKey — при каждой новой непустой строке вагон вздрагивает
export function CarScene({ walkMs = 0, alarm = false, shakeKey }: { walkMs?: number; alarm?: boolean; shakeKey?: string }) {
  const [arrived, setArrived] = useState(walkMs === 0);
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const clip = useId();

  useEffect(() => {
    if (!shakeKey || reduced) return;
    box.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "none" }],
      { duration: 450, easing: "ease-in-out" },
    );
  }, [shakeKey, reduced]);

  const bob = arrived ? undefined : "motion-safe:animate-car-bob";

  return (
    <div ref={box} className="relative overflow-hidden rounded-xl border bg-[#e9edf3]">
      <svg viewBox="0 74 400 144" role="img" aria-label="Салон вагона: проводник с тележкой идёт по проходу" className="block h-auto w-full">
        <defs>
          <clipPath id={`${clip}-l`}>
            <rect x="21" y="84" width="130" height="40" rx="9" />
          </clipPath>
          <clipPath id={`${clip}-r`}>
            <rect x="237" y="84" width="142" height="40" rx="9" />
          </clipPath>
        </defs>
        <Window x={16} width={140} clipId={`${clip}-l`} />
        <Window x={232} width={152} clipId={`${clip}-r`} />

        <rect y="200" width="400" height="18" fill="#8f9aa6" />
        <rect y="200" width="400" height="3" fill="#7c8894" />

        <Seat x={200} />
        <Seat x={278} />
        <Passenger x={240} coat="#7a7f87" skin="#e6c9a8" hair="#cfcfcf" />
        <Passenger x={316} coat="#c0674a" skin="#e8b892" hair="#2f2a26" />

        <g
          className={walkMs ? "motion-safe:animate-car-walk" : undefined}
          style={{ "--walk-ms": `${walkMs}ms` } as CSSProperties}
          onAnimationEnd={(event) => event.target === event.currentTarget && setArrived(true)}
        >
          <Trolley bob={bob} />
          <g className={bob}>
            <Conductor x={130} />
          </g>
        </g>
      </svg>
      {alarm && (
        <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_48px_8px_var(--destructive)] motion-safe:animate-pulse" />
      )}
    </div>
  );
}

function Window({ x, width, clipId }: { x: number; width: number; clipId: string }) {
  const inner = x + 5;
  const right = x + width - 5;
  return (
    <g>
      <rect x={x} y="80" width={width} height="48" rx="12" fill="#a9bccd" />
      <rect x={inner} y="84" width={width - 10} height="40" rx="9" fill="#d7e7f3" />
      <path d={`M${inner} 110 Q${inner + 50} 104 ${inner + 90} 110 T${right} 108 L${right} 124 L${inner} 124 Z`} fill="#a9cf9a" />
      <path d={`M${inner} 117 Q${inner + 70} 113 ${right} 117 L${right} 124 L${inner} 124 Z`} fill="#86b77b" />
      <g clipPath={`url(#${clipId})`}>
        <g className="motion-safe:animate-car-speed" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
          <line x1={inner + 20} y1="92" x2={inner + 70} y2="92" />
          <line x1={inner + 60} y1="99" x2={inner + 120} y2="99" />
          <line x1={inner + 14} y1="105" x2={inner + 50} y2="105" />
        </g>
      </g>
    </g>
  );
}

function Seat({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x + 8} 124 Q${x + 8} 114 ${x + 18} 114 L${x + 62} 114 Q${x + 72} 114 ${x + 72} 124 L${x + 74} 186 L${x + 6} 186 Z`} fill="#3d5a87" />
      <rect x={x + 21} y="118" width="38" height="17" rx="4" fill="#f3f5f7" />
      <rect x={x} y="180" width="80" height="18" rx="5" fill="#34507a" />
    </g>
  );
}

// Сидящий пассажир: x — центр фигуры
function Passenger({ x, coat, skin, hair }: { x: number; coat: string; skin: string; hair: string }) {
  return (
    <g>
      <path d={`M${x - 14} 186 L${x - 17} 199 L${x - 7} 199 L${x - 4} 186 Z`} fill="#4e4a45" />
      <path d={`M${x + 2} 186 L${x} 199 L${x + 10} 199 L${x + 11} 186 Z`} fill="#4e4a45" />
      <path d={`M${x - 19} 186 Q${x - 21} 156 ${x - 10} 146 L${x + 10} 146 Q${x + 21} 156 ${x + 19} 186 Z`} fill={coat} />
      <rect x={x - 3} y="137" width="6" height="9" fill={skin} />
      <circle cx={x} cy="129" r="11" fill={skin} />
      <path d={`M${x - 11} 127 Q${x - 11} 117 ${x} 117 Q${x + 11} 117 ${x + 11} 127 Q${x + 6} 121 ${x} 121 Q${x - 6} 121 ${x - 11} 127 Z`} fill={hair} />
      <circle cx={x + 4} cy="130" r="1.3" fill="#222" />
    </g>
  );
}

// Проводник толкает тележку: вытянутая рука лежит на её ручке. x — центр фигуры
function Conductor({ x }: { x: number }) {
  const coat = "#23406b";
  const skin = "#f0c8a4";
  return (
    <g>
      <rect x={x - 8} y="160" width="7" height="38" rx="3" fill="#1e2c45" />
      <rect x={x + 1} y="160" width="7" height="38" rx="3" fill="#1e2c45" />
      <ellipse cx={x - 4} cy="199" rx="6" ry="2.6" fill="#1b2230" />
      <ellipse cx={x + 5} cy="199" rx="6" ry="2.6" fill="#1b2230" />
      <path d={`M${x - 13} 162 L${x - 9} 122 Q${x} 116 ${x + 9} 122 L${x + 13} 162 Z`} fill={coat} />
      <path d={`M${x - 4} 119 L${x} 130 L${x + 4} 119 Z`} fill="#2a9d8f" />
      <path d={`M${x - 9} 126 Q${x - 15} 142 ${x - 11} 156`} stroke={coat} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d={`M${x + 8} 127 Q${x + 12} 142 ${x + 11} 152`} stroke={coat} strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx={x + 12} cy="154" r="3.4" fill={skin} />
      <rect x={x - 3} y="110" width="6" height="8" fill={skin} />
      <circle cx={x} cy="103" r="10" fill={skin} />
      <path d={`M${x - 10} 102 Q${x - 9} 91 ${x} 91 Q${x + 10} 91 ${x + 10} 102 Q${x + 6} 96 ${x} 96 Q${x - 6} 96 ${x - 10} 102 Z`} fill="#6b4a34" />
      <path d={`M${x - 10} 95 L${x + 10} 93 L${x + 9} 88 Q${x} 84 ${x - 9} 89 Z`} fill={coat} />
      <circle cx={x + 4} cy="104" r="1.2" fill="#222" />
    </g>
  );
}

// Тележка с напитками стоит перед проводником, стаканчики подрагивают на ходу
function Trolley({ bob }: { bob?: string }) {
  return (
    <g>
      <rect x="142" y="160" width="54" height="40" rx="4" fill="#b9c2cc" />
      <rect x="142" y="157" width="54" height="6" rx="3" fill="#98a3af" />
      <g className={bob}>
        <rect x="148" y="145" width="8" height="12" rx="1.5" fill="#fff" />
        <rect x="159" y="145" width="8" height="12" rx="1.5" fill="#fff" />
        <rect x="172" y="141" width="6" height="16" rx="1.5" fill="#5e8fbf" />
        <rect x="181" y="143" width="10" height="14" rx="2" fill="#e8b04b" />
      </g>
      <circle cx="150" cy="203" r="4" fill="#4b5561" />
      <circle cx="188" cy="203" r="4" fill="#4b5561" />
    </g>
  );
}
