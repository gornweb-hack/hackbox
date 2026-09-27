import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Эмблема ачивки — жетон, как вокзальный: кольцо с насечками, поле с тенью на правой половине
// (тот же приём, что у лиц персонажей) и пиктограмма по смыслу. id — из content/gamification.yaml.
// Закрытая ачивка — серая с замком. Новая ачивка без своей эмблемы получает звезду

interface Emblem {
  // Цвет поля жетона
  color: string;
  // Пиктограмма в квадрате 64×64, рисуется цветом ink. earned — у закрытой ачивки своих цветов нет
  picto: (ink: string, earned: boolean) => ReactNode;
}

const EMBLEMS: Record<string, Emblem> = {
  // Первый рейс: скоростной поезд сбоку, едет вправо — за ним полосы скорости, под ним рельс
  "first-trip": {
    color: "#e0a100",
    picto: (ink) => (
      <g>
        <g stroke={ink} strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <path d="M10 29 H15 M9 33 H14 M11 37 H15" />
        </g>
        <path d="M17 38 V29 Q17 25 21 25 H39 Q46 25 50 32 Q52 36 48 38 Z" fill={ink} />
        <g fill="currentColor" opacity="0.4">
          <rect x="21" y="28" width="4" height="4" rx="1" />
          <rect x="27" y="28" width="4" height="4" rx="1" />
          <rect x="33" y="28" width="4" height="4" rx="1" />
          <path d="M40 28 H43 Q45.5 29 47 32 H40 Z" />
        </g>
        <path d="M17 35 H49" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <path d="M15 42 H51" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    ),
  },
  // Холодная голова: секундомер со снежинкой
  "cold-head": {
    color: "#2a9d8f",
    picto: (ink) => (
      <g stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
        <circle cx="32" cy="35" r="12" />
        <path d="M29 20 H35 M32 20 V23 M41 25 L43 23" />
        <path d="M32 29 V41 M26.8 32 L37.2 38 M37.2 32 L26.8 38" strokeWidth="2.2" />
      </g>
    ),
  },
  // Первая помощь: медицинский крест
  "first-aid": {
    color: "#d63b3b",
    picto: (ink) => <path d="M28 20 H36 V28 H44 V36 H36 V44 H28 V36 H20 V28 H28 Z" fill={ink} />,
  },
  // Миротворец: две реплики, которые сошлись
  peacemaker: {
    color: "#5b45c9",
    picto: (ink) => (
      <g fill={ink}>
        <path d="M17 22 Q17 18 21 18 H33 Q37 18 37 22 V29 Q37 33 33 33 H25 L20 37 V33 Q17 33 17 29 Z" />
        <path d="M47 31 Q47 27 43 27 H31 Q27 27 27 31 V38 Q27 42 31 42 H39 L44 46 V42 Q47 42 47 38 Z" opacity="0.8" />
      </g>
    ),
  },
  // Безопасность прежде всего: щит с галочкой
  "safety-first": {
    color: "#1f9d55",
    picto: (ink) => (
      <g>
        <path d="M32 17 L45 22 V32 Q45 42 32 47 Q19 42 19 32 V22 Z" fill={ink} />
        <path d="M26 32 L30.5 36.5 L38.5 28" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      </g>
    ),
  },
  // Голос пассажира: сердце в реплике
  "passenger-voice": {
    color: "#e0524f",
    picto: (ink) => (
      <g>
        <path d="M18 23 Q18 18 23 18 H41 Q46 18 46 23 V35 Q46 40 41 40 H30 L23 46 V40 Q18 40 18 35 Z" fill={ink} />
        <path d="M32 36 L26 30 Q24 27 26.5 24.5 Q29.5 22.5 32 25.5 Q34.5 22.5 37.5 24.5 Q40 27 38 30 Z" fill="currentColor" opacity="0.5" />
      </g>
    ),
  },
  // Универсал: четыре сектора — четыре категории сценариев
  "all-rounder": {
    color: "#343a46",
    picto: (ink, earned) => (
      <g>
        <path d="M32 32 V17 A15 15 0 0 1 47 32 Z" fill={earned ? "#e0a100" : ink} />
        <path d="M32 32 H47 A15 15 0 0 1 32 47 Z" fill={earned ? "#2a9d8f" : ink} opacity={earned ? 1 : 0.75} />
        <path d="M32 32 V47 A15 15 0 0 1 17 32 Z" fill={earned ? "#d63b3b" : ink} />
        <path d="M32 32 H17 A15 15 0 0 1 32 17 Z" fill={earned ? "#5b45c9" : ink} opacity={earned ? 1 : 0.75} />
        <circle cx="32" cy="32" r="4" fill="#fff" />
      </g>
    ),
  },
  // Марафон: десять прохождений — «10» на рельсах
  marathon: {
    color: "#343a46",
    picto: (ink, earned) => (
      <g>
        <text x="32" y="35" textAnchor="middle" fontSize="17" fontWeight="700" fontFamily="ui-monospace, monospace" fill={earned ? "#ffb020" : ink}>
          10
        </text>
        <g stroke={ink} strokeWidth="2" strokeLinecap="round">
          <path d="M18 42 H46 M18 46 H46" />
          <path d="M22 40 V48 M29 40 V48 M36 40 V48 M43 40 V48" strokeWidth="1.5" />
        </g>
      </g>
    ),
  },
};

const FALLBACK: Emblem = {
  color: "#e0a100",
  picto: (ink) => <path d="M32 17 L36.5 27 L47 28 L39 35 L41.5 46 L32 40.5 L22.5 46 L25 35 L17 28 L27.5 27 Z" fill={ink} />,
};

const LOCKED = { color: "#e2e5ea", ink: "#b3b9c3", ring: "#c5cbd4" };

export function AchievementBadge({ id, earned, className }: { id: string; earned: boolean; className?: string }) {
  const emblem = EMBLEMS[id] ?? FALLBACK;
  const color = earned ? emblem.color : LOCKED.color;
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("shrink-0", className)} style={{ color }}>
      {/* Кольцо жетона с насечками */}
      <circle cx="32" cy="32" r="31" fill={earned ? "#15171c" : LOCKED.ring} />
      <g stroke={earned ? "#3a3f4a" : "#d6dae1"} strokeWidth="2" strokeLinecap="round">
        {Array.from({ length: 16 }, (_, index) => {
          const angle = (index * Math.PI) / 8;
          return <path key={index} d={`M${32 + 28 * Math.cos(angle)} ${32 + 28 * Math.sin(angle)} L${32 + 30 * Math.cos(angle)} ${32 + 30 * Math.sin(angle)}`} />;
        })}
      </g>
      <circle cx="32" cy="32" r="25" fill={color} />
      {/* Правая половина поля в тени — как у лиц персонажей */}
      <path d="M32 7 A25 25 0 0 1 32 57 Z" fill="#000" opacity={earned ? 0.12 : 0.04} />
      {emblem.picto(earned ? "#ffffff" : LOCKED.ink, earned)}
      {!earned && (
        <g>
          <circle cx="49" cy="49" r="10" fill="#586070" stroke="#fff" strokeWidth="2.5" />
          <rect x="44.5" y="48" width="9" height="7" rx="1.5" fill="#fff" />
          <path d="M46.5 48 V46 Q46.5 43 49 43 Q51.5 43 51.5 46 V48" stroke="#fff" strokeWidth="1.8" fill="none" />
        </g>
      )}
    </svg>
  );
}
