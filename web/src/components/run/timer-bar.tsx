"use client";

import { TimerIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Время на решение. Отсчёт идёт от остатка, который прислал сервер; на нуле onExpire вызывается один раз.
// Новый остаток с сервера — новый ключ компонента, отсчёт начинается заново
export function TimerBar({ seconds, remainingMs, onExpire }: { seconds: number; remainingMs: number; onExpire: () => void }) {
  const [left, setLeft] = useState(remainingMs);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const deadline = Date.now() + remainingMs;
    const timer = setInterval(() => {
      const rest = Math.max(0, deadline - Date.now());
      setLeft(rest);
      if (rest === 0) {
        clearInterval(timer);
        onExpireRef.current();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [remainingMs]);

  const secondsLeft = Math.ceil(left / 1000);
  return (
    <div className="flex items-center gap-3">
      <TimerIcon className="size-5 shrink-0 text-primary-text" />
      <div
        role="progressbar"
        aria-label="Время на решение"
        aria-valuemin={0}
        aria-valuemax={seconds}
        aria-valuenow={secondsLeft}
        className="h-2 flex-1 overflow-hidden rounded-full bg-track"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-linear motion-reduce:transition-none"
          style={{ width: `${(left / (seconds * 1000)) * 100}%` }}
        />
      </div>
      <span className="shrink-0 text-sm font-medium">Осталось {secondsLeft} с</span>
    </div>
  );
}
