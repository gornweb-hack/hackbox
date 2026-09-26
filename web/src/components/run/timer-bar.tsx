"use client";

import { TimerIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Последняя треть времени: полоса краснеет и пульсирует, сцена вагона показывает тревогу
const URGENT_SHARE = 1 / 3;

// Время на решение. Отсчёт идёт от остатка, который прислал сервер; на нуле onExpire вызывается один раз,
// на последней трети — onUrgent. Новый остаток с сервера — новый ключ компонента, отсчёт начинается заново
export function TimerBar({
  seconds,
  remainingMs,
  onExpire,
  onUrgent,
}: {
  seconds: number;
  remainingMs: number;
  onExpire: () => void;
  onUrgent: () => void;
}) {
  const [left, setLeft] = useState(remainingMs);
  const onExpireRef = useRef(onExpire);
  const onUrgentRef = useRef(onUrgent);

  useEffect(() => {
    onExpireRef.current = onExpire;
    onUrgentRef.current = onUrgent;
  });

  useEffect(() => {
    const deadline = Date.now() + remainingMs;
    const urgentAt = seconds * 1000 * URGENT_SHARE;
    let urgent = false;
    const timer = setInterval(() => {
      const rest = Math.max(0, deadline - Date.now());
      setLeft(rest);
      if (!urgent && rest <= urgentAt) {
        urgent = true;
        onUrgentRef.current();
      }
      if (rest === 0) {
        clearInterval(timer);
        onExpireRef.current();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [remainingMs, seconds]);

  const secondsLeft = Math.ceil(left / 1000);
  const urgent = left <= seconds * 1000 * URGENT_SHARE;
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-card">
      <TimerIcon className={cn("size-6 shrink-0", urgent ? "text-destructive" : "text-primary-text")} />
      <div
        role="progressbar"
        aria-label="Время на решение"
        aria-valuemin={0}
        aria-valuemax={seconds}
        aria-valuenow={secondsLeft}
        className="h-2.5 flex-1 overflow-hidden rounded-full bg-track"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-linear motion-reduce:transition-none",
            urgent ? "bg-destructive motion-safe:animate-pulse" : "bg-primary",
          )}
          style={{ width: `${(left / (seconds * 1000)) * 100}%` }}
        />
      </div>
      <span className={cn("shrink-0 text-lg font-semibold", urgent && "text-destructive")}>{secondsLeft} с</span>
    </div>
  );
}
