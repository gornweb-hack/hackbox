"use client";

import { type KeyboardEvent, useEffect, useState } from "react";

// Скорость печати: около 35 знаков в секунду — чуть быстрее обычного чтения, за текстом успеваешь следить
const CHAR_MS = 28;
// Паузы после знаков препинания, как в живой речи: после конца фразы дольше, после запятой короче
const PAUSE_MS: Record<string, number> = { ".": 180, "!": 180, "?": 180, "…": 180, ",": 80, ";": 80, ":": 80, "—": 80 };

// Текст ситуации «печатается» со скоростью чтения. Нажатие на блок (или Enter, пробел) показывает
// его целиком. instant — сразу весь текст: при таймере (серверное время уже идёт) и при «уменьшить
// движение». Родитель ставит key по узлу, чтобы печать начиналась заново; onDone вызывается один раз
export function TypedText({ text, instant, onDone }: { text: string; instant: boolean; onDone: () => void }) {
  const [shown, setShown] = useState(instant ? text.length : 0);
  const typing = shown < text.length;

  useEffect(() => {
    if (!typing) return;
    const pause = shown > 0 ? (PAUSE_MS[text[shown - 1]] ?? 0) : 0;
    const timer = setTimeout(() => {
      const next = shown + 1;
      setShown(next);
      if (next === text.length) onDone();
    }, CHAR_MS + pause);
    return () => clearTimeout(timer);
  }, [shown, typing, text, onDone]);

  const finish = () => {
    if (!typing) return;
    setShown(text.length);
    onDone();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    finish();
  };

  return (
    <div
      role={typing ? "button" : undefined}
      tabIndex={typing ? 0 : undefined}
      aria-label={typing ? "Показать текст целиком" : undefined}
      onClick={finish}
      onKeyDown={onKeyDown}
      className={typing ? "cursor-pointer outline-none" : undefined}
    >
      {/* Весь текст сразу разложен по строкам, ненапечатанная часть прозрачная: буквы проявляются на
          своих местах, слова не перескакивают на следующую строку, а блок не растёт при печати */}
      <p className="text-[17px] leading-[1.5] text-pretty text-white">
        <span className="sr-only">{text}</span>
        <span aria-hidden>
          {text.slice(0, shown)}
          <span className="text-transparent">{text.slice(shown)}</span>
        </span>
      </p>
      {typing && <span className="mt-2 block text-[13px] text-white/55">Нажмите, чтобы показать сразу</span>}
    </div>
  );
}
