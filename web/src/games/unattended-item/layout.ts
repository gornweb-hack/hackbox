import type { Emotion, LOOKS } from "@/components/run/scene/head";
import { type EventChoice, type ItemKind, ITEMS } from "./rules";

// Вагон мини-игры «Бесхозная вещь» сверху: геометрия, кто где сидит и где лежит находка.
// Расстановка случайная, но random приходит параметром — так её можно проверить тестом

export const WIDTH = 480;
export const HEIGHT = 800;
export const ROWS = 10;
export const ROW_Y0 = 132;
export const ROW_STEP = 60;
// Центры кресел: две пары слева и справа от прохода
export const SEAT_X = [86, 146, 334, 394];
export const AISLE_X = 240;
export const AISLE_TOP = 120;
export const AISLE_BOTTOM = 740;
// Вещь можно осмотреть, только подойдя к её ряду
export const REACH_Y = 45;
// Скорость проводника, пикселей в миллисекунду
export const WALK_SPEED = 0.45;
// Сумки с владельцами рядом — отвлекающие
const ATTENDED_BAGS = 4;

export type Look = keyof typeof LOOKS;

// Пассажиры в креслах; головы — те же персонажи, что в сценариях
export const PASSENGER_LOOKS: Look[] = ["man", "woman", "redhead", "neighbour", "elder"];
const COATS = ["#7a7f87", "#c0674a", "#5e8f6a", "#8a6fb0", "#c9892f", "#b0506e"];
const BAGS = ["#8a5a3c", "#2f3b4a", "#6d3a5b", "#4f6284"];

// Кто говорит в диалогах игры: внешность, цвет одежды и эмоция бюста
export const SPEAKERS = {
  neighbour: { look: "neighbour", coat: "#a8462f", emotion: "calm", name: "Алова", role: "пассажирка" },
  elder: { look: "elder", coat: "#6d727a", emotion: "worried", name: "Серов", role: "пассажир" },
  tea: { look: "woman", coat: "#b0506e", emotion: "smile", name: "Пассажирка", role: "место 3В" },
  grabber: { look: "man", coat: "#8a6fb0", emotion: "angry", name: "Пассажир", role: "место 6А" },
} as const satisfies Record<string, { look: Look; coat: string; emotion: Emotion; name: string; role: string }>;

export type Speaker = keyof typeof SPEAKERS;

export interface Spot {
  x: number;
  y: number;
}

export interface Passenger {
  seat: Spot;
  look: Look;
  coat: string;
}

// Сумка рядом с владельцем: тронул — «Это моя сумка»
export interface Bag {
  seat: Spot;
  color: string;
  owner: Passenger;
}

export interface Car {
  kind: ItemKind;
  item: Spot;
  passengers: Passenger[];
  bags: Bag[];
  // Событие партии: пассажир хочет сам унести опасную вещь или просит чай посреди осмотра
  plannedEvent: EventChoice["id"] | null;
}

type Random = () => number;

const pick = <T>(items: readonly T[], random: Random) => items[Math.floor(random() * items.length)];

export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Находка — в паре кресел, где никого нет (игрушка — в проходе), не в последних рядах, чтобы до
// неё нужно было дойти. У рюкзака и коробки рядом сидит тот, кто подскажет. Ещё несколько сумок
// лежат рядом с владельцами — они отвлекают
export function makeCar(random: Random = Math.random): Car {
  const kind = pick(Object.keys(ITEMS) as ItemKind[], random);
  const rule = ITEMS[kind];
  const plannedEvent = rule.grabbable && random() < 0.5 ? "grab" : random() < 0.6 ? "tea" : null;

  const pairs = shuffle(
    Array.from({ length: ROWS * 2 }, (_, index) => ({ row: Math.floor(index / 2), side: index % 2 })),
    random,
  );
  const target = pairs.splice(
    pairs.findIndex((pair) => pair.row < ROWS - 3),
    1,
  )[0];
  const seatsOf = (pair: { row: number; side: number }): Spot[] => {
    const y = ROW_Y0 + pair.row * ROW_STEP;
    return [
      { x: SEAT_X[pair.side * 2], y },
      { x: SEAT_X[pair.side * 2 + 1], y },
    ];
  };

  const passengers: Passenger[] = [];
  const bags: Bag[] = [];
  const seat = (spot: Spot, look: Look) => {
    const passenger = { seat: spot, look, coat: pick(COATS, random) };
    passengers.push(passenger);
    return passenger;
  };

  const [itemSeat, besideSeat] = shuffle(seatsOf(target), random);
  if (rule.clue) seat(besideSeat, SPEAKERS[rule.clue.speaker].look);
  const item = kind === "toy" ? { x: AISLE_X + Math.round(random() * 50 - 25), y: itemSeat.y + 30 } : itemSeat;

  pairs.forEach((pair, index) => {
    const [a, b] = shuffle(seatsOf(pair), random);
    if (index < ATTENDED_BAGS) {
      bags.push({ seat: b, color: pick(BAGS, random), owner: seat(a, pick(PASSENGER_LOOKS, random)) });
      return;
    }
    if (random() < 0.5) seat(a, pick(PASSENGER_LOOKS, random));
    if (random() < 0.4) seat(b, pick(PASSENGER_LOOKS, random));
  });

  return { kind, item, passengers, bags, plannedEvent };
}

export const near = (y: number, spot: Spot) => Math.abs(y - spot.y) <= REACH_Y;

export const clampAisle = (y: number) => Math.min(AISLE_BOTTOM, Math.max(AISLE_TOP, y));
