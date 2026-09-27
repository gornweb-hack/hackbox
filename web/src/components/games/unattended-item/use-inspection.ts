"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { initialState, reducer } from "@/games/unattended-item/flow";
import { AISLE_BOTTOM, type Bag, clampAisle, makeCar, near, type Spot, WALK_SPEED } from "@/games/unattended-item/layout";
import type { Result } from "@/games/unattended-item/rules";

// Пауза перед разбором: игрок успевает увидеть последний выбор и вспышку
const REPORT_MS = 900;
// Сколько висит реплика «Это моя сумка»
const BUBBLE_MS = 1400;

// Состояние мини-игры «Бесхозная вещь» вокруг чистого редьюсера из games/unattended-item/flow.ts:
// часы, просьба о чае, ходьба проводника (касанием и стрелками) и итог в onFinish
export function useInspection(onFinish: (result: Result) => void) {
  const [car] = useState(makeCar);
  const [state, dispatch] = useReducer(reducer, car, (value) => initialState(value.kind, value.plannedEvent));
  const [reported, setReported] = useState(false);
  const [bubble, setBubble] = useState<{ at: Spot; key: number } | null>(null);
  const onFinishRef = useRef(onFinish);
  const searching = state.phase === "search";
  const walker = useWalker(searching);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    if (!searching) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [searching]);

  // Чай просят один раз, через 6–11 секунд после начала; если вещь уже нашли — редьюсер просьбу пропустит
  const started = state.phase !== "intro";
  useEffect(() => {
    if (!started || car.plannedEvent !== "tea") return;
    const timer = setTimeout(() => dispatch({ type: "tea" }), 6000 + Math.random() * 5000);
    return () => clearTimeout(timer);
  }, [started, car.plannedEvent]);

  useEffect(() => {
    if (!bubble) return;
    const timer = setTimeout(() => setBubble(null), BUBBLE_MS);
    return () => clearTimeout(timer);
  }, [bubble]);

  const { phase, result } = state;
  useEffect(() => {
    if (phase !== "over" || !result) return;
    const timer = setTimeout(() => {
      setReported(true);
      onFinishRef.current(result);
    }, REPORT_MS);
    return () => clearTimeout(timer);
  }, [phase, result]);

  return {
    car,
    state,
    dispatch,
    y: walker.y,
    bubble,
    reported,
    // Касание прохода — идти к этой точке
    walk: (y: number) => searching && walker.walkTo(y),
    // Касание вещи — подойти к её ряду и осмотреть
    inspectItem: () => searching && walker.walkTo(car.item.y, (y) => near(y, car.item) && dispatch({ type: "found" })),
    // Чужая сумка: владелец рядом отвечает, что вещь его
    inspectBag: (bag: Bag) =>
      searching &&
      walker.walkTo(bag.seat.y, (y) => {
        if (!near(y, bag.seat)) return;
        dispatch({ type: "attended" });
        setBubble({ at: bag.owner.seat, key: Date.now() });
      }),
  };
}

// Ходьба проводника по проходу: к цели с постоянной скоростью, стрелки ↑/↓ ведут вручную.
// Состояние анимации — в ref, чтобы кадр не зависел от рендера; цикл кадров сам останавливается на месте
function useWalker(active: boolean) {
  const [y, setY] = useState(AISLE_BOTTOM);
  const sim = useRef({ y: AISLE_BOTTOM, target: AISLE_BOTTOM, dir: 0, then: null as ((y: number) => void) | null, raf: 0 });

  function kick() {
    const s = sim.current;
    if (s.raf) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      if (s.dir !== 0) {
        s.y = clampAisle(s.y + s.dir * WALK_SPEED * dt);
        s.target = s.y;
      } else {
        const left = s.target - s.y;
        s.y = Math.abs(left) <= WALK_SPEED * dt ? s.target : s.y + Math.sign(left) * WALK_SPEED * dt;
      }
      setY(s.y);
      if (s.dir === 0 && s.y === s.target) {
        s.raf = 0;
        const then = s.then;
        s.then = null;
        then?.(s.y);
        return;
      }
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }

  function walkTo(target: number, then?: (y: number) => void) {
    const s = sim.current;
    s.target = clampAisle(target);
    s.then = then ?? null;
    kick();
  }

  // Осмотр прервался (чай, находка, итог) — проводник останавливается там, где стоит
  useEffect(() => {
    if (active) return;
    const s = sim.current;
    cancelAnimationFrame(s.raf);
    Object.assign(s, { raf: 0, target: s.y, dir: 0, then: null });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const s = sim.current;
    const direction = (key: string) => (key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0);
    const down = (event: KeyboardEvent) => {
      const dir = direction(event.key);
      if (dir === 0) return;
      // Иначе стрелки прокручивают страницу
      event.preventDefault();
      s.dir = dir;
      s.then = null;
      kick();
    };
    const up = (event: KeyboardEvent) => {
      if (direction(event.key) === s.dir) s.dir = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      s.dir = 0;
    };
  }, [active]);

  useEffect(() => {
    const s = sim.current;
    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  return { y, walkTo };
}
