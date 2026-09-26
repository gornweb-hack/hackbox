import type { Tone } from "@/lib/scales";
import { cn } from "@/lib/utils";

// Вспышка по краям экрана после решения и на исходе: зелёная — хорошо, красная — плохо.
// Родитель ставит key, чтобы вспышка повторялась. При «уменьшить движение» её нет: без анимации
// элемент остаётся прозрачным
export function ScreenFlash({ tone }: { tone: Tone }) {
  if (tone === "neutral") return null;
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-50 opacity-0 motion-safe:animate-screen-flash",
        tone === "good" ? "shadow-[inset_0_0_120px_24px_var(--zone-green)]" : "shadow-[inset_0_0_120px_24px_var(--zone-red)]",
      )}
    />
  );
}
