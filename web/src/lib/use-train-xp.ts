"use client";

import { useEffect, useState } from "react";

// Где поезд стоял, когда человек в прошлый раз открывал маршрут. Хранится в браузере:
// это удобство одного экрана, а не данные — если значения нет, поезд просто стоит на месте
const KEY = "route:last-xp";

function readLastXp(): number | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    // null — маршрут в этом браузере ещё не открывали; 0 — открывали новичком
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

// Опыт для отрисовки поезда: сначала прошлое значение, через мгновение — текущее, и поезд
// доезжает по линии. from — откуда поехал (для «въезда» на новую станцию)
export function useTrainXp(xp: number, reduced: boolean) {
  const [from] = useState(() => {
    const last = readLastXp();
    return last !== null && last < xp ? last : xp;
  });
  const [shown, setShown] = useState(from);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, String(xp));
    } catch {
      // Хранилище недоступно (приватный режим) — анимация в следующий раз просто не сработает
    }
    const timer = setTimeout(() => setShown(xp), reduced ? 0 : 450);
    return () => clearTimeout(timer);
  }, [xp, reduced]);

  return { from, shown };
}
