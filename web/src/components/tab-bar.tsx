"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Геометрия и цвета — из handoff «Капля» (design_handoff_r400_tabbar_drop)
const PAD_X = 5;
const PAD_Y = 4;
const ITEM_H = 54;
const INACTIVE = [74, 82, 98]; // #4A5262, под каплей — белый

// Пружины: капля (позиция — дробный индекс пункта) и масштаб иконок
const DROP_K = 210;
const DROP_C = 19;
const ICON_K = 520;
const ICON_C = 15;
const GLOW_MS = 650;

// Изменяемое состояние анимации живёт в ref, чтобы кадр не зависел от рендера
interface Sim {
  p: number;
  v: number;
  target: number;
  press: number;
  pressed: boolean;
  moved: boolean;
  x0: number;
  pressedIndex: number;
  bs: number[];
  bv: number[];
  bT: number[];
  glow: { x: number; t: number } | null;
  shown: boolean;
  raf: number;
}

// Снимок для рендера: копируется из Sim раз в кадр
interface View {
  p: number;
  v: number;
  press: number;
  pressed: boolean;
  bs: number[];
  glow: { x: number; a: number } | null;
  shown: boolean;
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Мобильная навигация: стеклянная капсула, активный пункт — синяя капля.
// При переходе капля сжимается в круг, подпрыгивает и опускается на новый пункт
export function TabBar({ items, active }: { items: NavItem[]; active: number }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const capRef = useRef<HTMLDivElement>(null);
  const n = items.length;
  const start = Math.max(0, active);

  const sim = useRef<Sim>({
    p: start,
    v: 0,
    target: start,
    press: 0,
    pressed: false,
    moved: false,
    x0: 0,
    pressedIndex: -1,
    bs: items.map(() => 1),
    bv: items.map(() => 0),
    bT: items.map(() => 1),
    glow: null,
    shown: active >= 0,
    raf: 0,
  });
  const [view, setView] = useState<View>(() => ({
    p: start,
    v: 0,
    press: 0,
    pressed: false,
    bs: items.map(() => 1),
    glow: null,
    shown: active >= 0,
  }));

  // Цикл кадров запускается по событию и сам останавливается, когда всё успокоилось
  function kick() {
    const s = sim.current;
    if (s.raf) return;
    let t0 = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - t0) / 1000);
      t0 = now;
      s.v += (DROP_K * (s.target - s.p) - DROP_C * s.v) * dt;
      s.p += s.v * dt;
      s.press += ((s.pressed ? 1 : 0) - s.press) * Math.min(1, dt * 16);
      let still = true;
      for (let i = 0; i < n; i++) {
        s.bv[i] += (ICON_K * (s.bT[i] - s.bs[i]) - ICON_C * s.bv[i]) * dt;
        s.bs[i] += s.bv[i] * dt;
        if (Math.abs(s.bT[i] - s.bs[i]) > 0.002 || Math.abs(s.bv[i]) > 0.02) still = false;
      }
      if (s.glow && now - s.glow.t > GLOW_MS) s.glow = null;
      // «Уменьшить движение»: без полёта, отскока и блика — капля сразу на месте
      if (reduced) {
        s.p = s.target;
        s.v = 0;
        s.bs.fill(1);
        s.bv.fill(0);
        s.glow = null;
      }
      const done =
        Math.abs(s.target - s.p) < 0.002 && Math.abs(s.v) < 0.02 && !s.pressed && s.press < 0.01 && still && !s.glow;
      if (done) {
        s.p = s.target;
        s.v = 0;
        s.press = 0;
        s.bs.fill(1);
        s.bv.fill(0);
      }
      setView({
        p: s.p,
        v: s.v,
        press: s.press,
        pressed: s.pressed,
        bs: [...s.bs],
        glow: s.glow && { x: s.glow.x, a: clamp((now - s.glow.t) / GLOW_MS, 0, 1) },
        shown: s.shown,
      });
      s.raf = done ? 0 : requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }

  // Эффекту нужен kick из последнего рендера (он читает reduced), а перезапуск — только при смене пункта
  const startDrop = useEffectEvent(kick);

  // Активный пункт задаёт адрес: капля едет к нему и после ссылок вне бара.
  // На страницах вне бара (уведомления, администрирование) капля скрыта
  useEffect(() => {
    const s = sim.current;
    if (s.pressed) return;
    s.shown = active >= 0;
    if (active >= 0) s.target = active;
    startDrop();
  }, [active]);

  useEffect(() => {
    const s = sim.current;
    // Обнуляем, иначе после повторного монтирования (Strict Mode в dev) kick решит, что цикл ещё идёт
    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  // Позиция пальца в пунктах: 0 — центр первого, n−1 — центр последнего
  function pointerAt(e: PointerEvent) {
    const rect = capRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cont = clamp((x - PAD_X) / ((rect.width - PAD_X * 2) / n) - 0.5, 0, n - 1);
    return { x, cont, near: Math.round(cont) };
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    // Иначе браузер заберёт жест под прокрутку
    e.currentTarget.setPointerCapture(e.pointerId);
    const s = sim.current;
    const at = pointerAt(e);
    s.pressed = true;
    s.moved = false;
    s.shown = true;
    s.x0 = e.clientX;
    s.pressedIndex = at.near;
    s.bT[at.near] = 0.82;
    s.target = at.near;
    s.glow = { x: at.x, t: performance.now() };
    kick();
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const s = sim.current;
    if (!s.pressed) return;
    // Сдвиг больше 6 px — это перетаскивание: капля едет за пальцем
    if (!s.moved && Math.abs(e.clientX - s.x0) > 6) {
      s.moved = true;
      s.bT[s.pressedIndex] = 1;
    }
    if (s.moved) {
      s.target = pointerAt(e).cont;
      kick();
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const s = sim.current;
    if (!s.pressed) return;
    s.pressed = false;
    const i = pointerAt(e).near;
    s.bT[s.pressedIndex] = 1;
    s.bv[i] += s.moved ? 5 : 11;
    s.target = i;
    navigator.vibrate?.(8);
    kick();
    if (i !== active) router.push(items[i].href);
  }

  // Мышь и палец обрабатывает капсула, ссылка переходит сама только с клавиатуры
  function onLinkClick(e: MouseEvent, i: number) {
    if (e.detail !== 0) {
      e.preventDefault();
      return;
    }
    sim.current.bv[i] -= 7;
    kick();
  }

  const { p, v, press, pressed, bs, glow, shown } = view;
  const speed = Math.abs(v);
  const lift = Math.min(1, speed / 3.2); // отрыв: 0 — пилюля в покое, 1 — круг в полёте
  const m = Math.max(press, Math.min(1, speed / 5));
  const dropH = lerp(ITEM_H, 50, lift);

  return (
    <>
      {/* Градиент отделяет бар от прокручиваемого контента */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[130px] bg-linear-to-b from-background/0 to-background/80 lg:hidden"
      />
      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 lg:hidden"
      >
        <div
          ref={capRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="glass relative h-16 cursor-pointer touch-none rounded-full select-none"
        >

          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full transition-opacity duration-200"
            style={{
              left: `calc(${PAD_X}px + (100% - ${PAD_X * 2}px) * ${(p + 0.5) / n})`,
              top: PAD_Y + (ITEM_H - dropH) / 2 - 14 * lift,
              width: `calc((100% - ${PAD_X * 2}px) / ${n} * ${1 - lift} + ${50 * lift}px)`,
              height: dropH,
              transform: `translateX(-50%) scale(${1 + 0.08 * press})`,
              opacity: shown ? 1 : 0,
              // Синий — только ровной заливкой; тень графитовая, как у главной кнопки, без цветного свечения
              background: "var(--primary)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,.55), inset 0 -2px 6px rgba(8,20,90,.25), 0 ${6 + 10 * lift}px ${16 + 12 * lift}px -8px rgba(18,20,24,.5)`,
            }}
          />

          {/* Блик от точки касания; обрезан по капсуле отдельным слоем, сама капсула не обрезает каплю */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            {glow && (
              <div
                className="absolute top-1/2 -mt-[66px] -ml-[66px] size-[132px] rounded-full"
                style={{
                  left: glow.x,
                  background:
                    "radial-gradient(circle, rgba(255,255,255,.95), rgba(255,255,255,.35) 38%, rgba(255,255,255,0) 66%)",
                  opacity: pressed ? 0.9 : 0.9 * (1 - glow.a),
                  transform: `scale(${0.35 + 1.25 * (1 - (1 - glow.a) ** 3)})`,
                }}
              />
            )}
          </div>

          <div className="absolute inset-x-[5px] inset-y-1 flex">
            {items.map(({ href, label, icon: Icon }, i) => {
              // Насколько капля над пунктом: от него зависят цвет и лёгкое увеличение иконки
              const ov = shown ? clamp(1 - Math.abs(p - i) / 0.8, 0, 1) : 0;
              const [r, g, b] = INACTIVE.map((c) => Math.round(lerp(c, 255, ov)));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={i === active ? "page" : undefined}
                  onClick={(e) => onLinkClick(e, i)}
                  draggable={false}
                  style={{ color: `rgb(${r},${g},${b})` }}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full outline-none",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <span
                    className="flex"
                    style={{
                      transform: `translateY(${Math.min(0, (1 - bs[i]) * 16)}px) scale(${(1 + 0.06 * ov * m) * bs[i]})`,
                    }}
                  >
                    <Icon className="size-[22px]" strokeWidth={2} />
                  </span>
                  <span
                    className={cn(
                      "text-[11px] leading-[1.1] whitespace-nowrap",
                      i === active ? "font-semibold" : "font-medium",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
