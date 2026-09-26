"use client";

import { useEffect, useState } from "react";

// Текст ситуации «печатается», пока проводник идёт по вагону. Нажатие показывает его целиком.
// instant — сразу весь текст: при таймере (серверное время уже идёт) и при «уменьшить движение».
// Родитель ставит key по узлу, чтобы печать начиналась заново; onDone вызывается один раз в конце
export function TypedText({ text, instant, onDone }: { text: string; instant: boolean; onDone: () => void }) {
  const [shown, setShown] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (shown >= text.length) return;
    const timer = setTimeout(() => {
      const next = Math.min(text.length, shown + 2);
      setShown(next);
      if (next === text.length) onDone();
    }, 16);
    return () => clearTimeout(timer);
  }, [shown, text.length, onDone]);

  const finish = () => {
    if (shown >= text.length) return;
    setShown(text.length);
    onDone();
  };

  return (
    <p onClick={finish} className="text-[17px] leading-[1.5] text-pretty text-white">
      <span className="sr-only">{text}</span>
      <span aria-hidden>{text.slice(0, shown)}</span>
    </p>
  );
}
