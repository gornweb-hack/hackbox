"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

// Число набегает от нуля до target за durationMs — итог разбора ощущается как итог.
// При «уменьшить движение» сразу возвращает target
export function useCountUp(target: number, durationMs = 800) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  return reduced ? target : value;
}
