"use client";

import { useEffect, useId, useState } from "react";
import { GLASS_RIM } from "@/lib/glass";
import {
  ARC_LENGTH,
  CYCLE,
  DESIGN_HEIGHT,
  LINES,
  type LoaderFrame,
  lineX,
  loaderFrame,
  STILL_T,
} from "@/lib/loader-timeline";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

const MUTED = "#4A5262";

// Время анимации: t идёт по кругу 0…CYCLE, dist — путь линий скорости с начала цикла.
// started — пошёл первый кадр: до этого (и на сервере) заставка ничего не рисует, поэтому разметка
// сервера и браузера совпадает. При «Уменьшить движение» часы стоят на итоговом кадре
function useLoaderClock() {
  const reduced = useReducedMotion();
  const [clock, setClock] = useState({ t: 0, dist: 0, width: 390, started: false });

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let dist = 0;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (t >= CYCLE) {
        t -= CYCLE;
        dist = 0;
      }
      // Линии ускоряются вместе со стрелкой: на 400 км/ч — около 960 px/с
      dist += loaderFrame(t).kmh * dt * 2.4;
      setClock({ t, dist, width: window.innerWidth, started: true });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return {
    t: reduced ? STILL_T : clock.t,
    dist: reduced ? 0 : clock.dist,
    width: clock.width,
    started: reduced || clock.started,
    reduced,
  };
}

// Стеклянная плитка со спидометром: дуга 270° набирает скорость, на 400 — толчок и кольцо
function SpeedTile({ frame }: { frame: LoaderFrame }) {
  const gradient = useId();
  const { fr } = frame;
  const angle = ((135 + 270 * fr) * Math.PI) / 180;

  return (
    <div
      className="relative size-[132px] shrink-0"
      style={{
        opacity: frame.tileOpacity,
        transform: `translateX(${frame.shakeX}px) scale(${frame.tileScale})`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-[40px] border-2 border-primary"
        style={{ transform: `scale(${frame.ringScale})`, opacity: frame.ringOpacity }}
      />
      <div
        className="absolute inset-0 rounded-[40px] border border-white/70"
        style={{
          background: "rgba(255,255,255,.46)",
          backdropFilter: "blur(22px) saturate(190%)",
          WebkitBackdropFilter: "blur(22px) saturate(190%)",
          // Синее свечение растёт со скоростью
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.95), inset 0 -1px 1px rgba(255,255,255,.4), 0 18px 40px -16px rgba(20,40,110,.35), 0 0 ${44 * fr}px ${4 * fr}px rgba(31,91,255,${0.3 * fr})`,
        }}
      >
        <span aria-hidden style={GLASS_RIM} className="pointer-events-none absolute inset-0 rounded-[inherit]" />
      </div>
      <svg aria-hidden viewBox="0 0 120 120" className="absolute top-1.5 left-1.5 size-[120px] overflow-visible">
        <defs>
          <linearGradient id={gradient} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#00B2FF" />
            <stop offset="1" stopColor="#1F5BFF" />
          </linearGradient>
        </defs>
        <path d="M27.47 92.53A46 46 0 1 1 92.53 92.53" fill="none" stroke="rgba(15,28,60,.10)" strokeWidth={7} strokeLinecap="round" />
        <path
          d="M27.47 92.53A46 46 0 1 1 92.53 92.53"
          fill="none"
          stroke={`url(#${gradient})`}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH * fr} 400`}
          style={{ filter: "drop-shadow(0 0 6px rgba(31,91,255,.55))" }}
        />
        {fr > 0 && (
          <circle
            cx={60 + 46 * Math.cos(angle)}
            cy={60 + 46 * Math.sin(angle)}
            r={5.5}
            fill="#FFFFFF"
            stroke="#1F5BFF"
            strokeWidth={3}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-[36px] leading-none font-semibold tracking-[-0.04em] tabular-nums">{frame.kmh}</span>
        <span className="text-xs font-medium" style={{ color: MUTED }}>
          км/ч
        </span>
      </div>
    </div>
  );
}

// Влёт слова с размытием движения: w = 0 — ещё за кадром слева, 1 — на месте
function flyIn(w: number) {
  return {
    opacity: w,
    transform: `translateX(${-40 * (1 - w)}px) skewX(${-18 * (1 - w)}deg)`,
    filter: `blur(${8 * (1 - w)}px)`,
  };
}

// Полноэкранная заставка «Разгон до 400» — один раз при первом входе во вкладке (AppShell)
export function SplashScreen() {
  const { t, dist, width, started, reduced } = useLoaderClock();
  if (!started) return null;
  const frame = loaderFrame(t);

  return (
    <div
      role="img"
      aria-label="Рейс 400 — загрузка"
      className="fixed inset-0 z-50 overflow-hidden bg-[#E9EDF5] text-[#0F1217] duration-200 motion-safe:animate-in motion-safe:fade-in"
    >
      <div aria-hidden className="absolute inset-0 bg-linear-to-b from-[#F1F3F8] via-[#E6EBF4] via-55% to-[#EDEFF5]">
        <Blob className="-top-40 -right-45" color="rgba(31,91,255,.55)" />
        <Blob className="top-[30%] -left-60" color="rgba(0,178,255,.36)" />
        <Blob className="-right-50 -bottom-50" color="rgba(112,86,255,.30)" />
      </div>

      {!reduced &&
        LINES.map((line) => (
          <div
            key={line.y}
            aria-hidden
            className="absolute rounded-[2px] bg-linear-to-r from-primary/85 to-primary/0"
            style={{
              // В макете экран высотой 844: линии держим на тех же расстояниях от центра
              top: `calc(50% + ${line.y - DESIGN_HEIGHT / 2}px)`,
              left: lineX(line, dist, width),
              width: line.width,
              height: line.height,
              opacity: 0.85 * frame.fr * frame.go,
            }}
          />
        ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[30px]" style={{ opacity: frame.go }}>
        <SpeedTile frame={frame} />
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-baseline gap-3 text-[42px] leading-none font-semibold tracking-[-0.035em]">
            <span className="inline-block" style={flyIn(frame.word1)}>
              Рейс
            </span>
            <span className="inline-block text-primary" style={flyIn(frame.word2)}>
              400
            </span>
          </div>
          <span
            className="text-[15px]"
            style={{ color: MUTED, opacity: frame.caption, transform: `translateY(${8 * (1 - frame.caption)}px)` }}
          >
            Тренажёр проводника ВСМ
          </span>
        </div>
      </div>
    </div>
  );
}

function Blob({ className, color }: { className: string; color: string }) {
  return (
    <div
      className={cn("absolute size-[560px] rounded-full", className)}
      style={{ background: `radial-gradient(circle, ${color}, transparent 66%)` }}
    />
  );
}
