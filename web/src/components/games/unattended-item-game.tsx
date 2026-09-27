"use client";

import { useEffect, useRef } from "react";
import type { Result } from "@/games/unattended-item/rules";

// Холст мини-игры. Phaser и спрайты грузятся динамически и только в браузере: движку нужен window,
// а остальному приложению он не нужен. Спрайты — персонажи сценариев, отрендеренные в картинки.
// При уходе со страницы игра уничтожается
export function UnattendedItemGame({ onFinish }: { onFinish: (result: Result) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    void Promise.all([import("phaser"), import("@/games/unattended-item/scene"), import("@/games/unattended-item/sprites")])
      .then(async ([{ default: Phaser }, { createUnattendedItemGame }, { loadSprites }]) => {
        const sprites = await loadSprites();
        if (cancelled || !box.current) return;
        game = createUnattendedItemGame(Phaser, box.current, sprites, (result) => onFinishRef.current(result));
      });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return <div ref={box} className="mx-auto aspect-[480/800] w-full max-w-[420px] overflow-hidden rounded-2xl border bg-background" />;
}
