"use client";

import { useEffect } from "react";

// Какие прохождения уже отпраздновали — чтобы разбор, открытый повторно из истории, не салютовал.
// Хранится в браузере: это удобство одного экрана, а не данные
const KEY = "report:celebrated";
const REMEMBER = 20;
// Цвета «Рейса 400»: синий, янтарь табло, зелёный, бирюзовый платок, фиолетовые чернила штампа
const COLORS = ["#1f5bff", "#ffb020", "#1f9d55", "#2a9d8f", "#5b45c9"];

function celebrated(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

// Конфетти, когда сценарий пройден на отлично: два залпа снизу с боков и один из центра. Слой выше
// показа новых ачивок и уровня (z-70), чтобы конфетти летело поверх него.
// Библиотека грузится только в этот момент; при «уменьшить движение» салюта нет
export function useCelebration(runId: string, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const seen = celebrated();
    if (seen.includes(runId)) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify([...seen, runId].slice(-REMEMBER)));
    } catch {
      // Хранилище недоступно — салют просто может повториться при следующем открытии
    }
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const base = { colors: COLORS, disableForReducedMotion: true, zIndex: 80, ticks: 240 };
      void confetti({ ...base, particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.9 } });
      void confetti({ ...base, particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.9 } });
      setTimeout(() => {
        if (!cancelled) void confetti({ ...base, particleCount: 90, spread: 100, startVelocity: 35, origin: { x: 0.5, y: 0.35 } });
      }, 350);
    });
    return () => {
      cancelled = true;
    };
  }, [runId, active]);
}
