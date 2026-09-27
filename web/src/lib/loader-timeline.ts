// Таймлайн экрана загрузки «Разгон до 400» (handoff design_handoff_r400_loader_speed, вариант 5a).
// Здесь только числа кадра по времени t, без React: так формулы видно целиком и их можно проверить тестом

// Длина цикла, с: разгон, финал с названием, затухание — и заново
export const CYCLE = 3.8;
// Итоговый кадр для «Уменьшить движение»: дуга полная, название и подпись на месте
export const STILL_T = 2.95;
// Заставка при входе держится, пока анимация не дойдёт до названия и подписи
export const MIN_SPLASH_MS = 2900;// Отметка в sessionStorage: полную заставку в этой вкладке уже показали. Выход её стирает
export const SPLASH_SEEN_KEY = "r400:splash";
// Длина дуги спидометра (270° радиусом 46) — для stroke-dasharray
export const ARC_LENGTH = 216.77;
// Высота экрана в макете: от её середины отсчитываются линии скорости
export const DESIGN_HEIGHT = 844;

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Доля пройденного отрезка [a, b] в момент t
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
export const easeOutBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;

export interface LoaderFrame {
  tileOpacity: number;
  tileScale: number;
  // Доля разгона 0…1 и скорость на спидометре
  fr: number;
  kmh: number;
  ringScale: number;
  ringOpacity: number;
  // Толчок плитки на 400, px
  shakeX: number;
  // Влёт слов «Рейс» и «400»: 0 — ещё нет, 1 — на месте
  word1: number;
  word2: number;
  caption: number;
  // Общая видимость: в конце цикла всё гаснет
  go: number;
}

export function loaderFrame(t: number): LoaderFrame {
  const fr = easeInOutCubic(seg(t, 0.3, 2.0));
  const ring = seg(t, 2.0, 2.7);
  const k = t - 2;
  return {
    tileOpacity: seg(t, 0, 0.25),
    tileScale: lerp(0.6, 1, easeOutBack(seg(t, 0, 0.45))),
    fr,
    kmh: Math.round(400 * fr),
    ringScale: 1 + 0.8 * easeOutCubic(ring),
    ringOpacity: t >= 2 ? 0.6 * (1 - ring) : 0,
    shakeX: k > 0 ? -7 * Math.exp(-7 * k) * Math.sin(28 * k) : 0,
    word1: easeOutCubic(seg(t, 2.0, 2.55)),
    word2: easeOutCubic(seg(t, 2.1, 2.65)),
    caption: seg(t, 2.5, 2.9),
    go: 1 - seg(t, 3.35, 3.8),
  };
}

export interface SpeedLine {
  y: number;
  width: number;
  height: number;
  mult: number;
  offset: number;
}

// Линии скорости из макета: y — на экране высотой 844
export const LINES: SpeedLine[] = [
  { y: 214, width: 110, height: 1, mult: 1.3, offset: 330 },
  { y: 250, width: 150, height: 2, mult: 1.0, offset: 40 },
  { y: 292, width: 90, height: 1, mult: 1.4, offset: 210 },
  { y: 334, width: 220, height: 2, mult: 0.8, offset: 90 },
  { y: 510, width: 120, height: 1, mult: 1.2, offset: 300 },
  { y: 552, width: 180, height: 2, mult: 0.9, offset: 20 },
  { y: 594, width: 70, height: 1, mult: 1.6, offset: 160 },
  { y: 640, width: 160, height: 2, mult: 1.1, offset: 260 },
];

// Линия едет справа налево и, уйдя за левый край, появляется справа. dist — путь с начала цикла, px
export function lineX(line: SpeedLine, dist: number, screenWidth: number) {
  return screenWidth - ((line.offset + dist * line.mult) % (screenWidth + line.width));
}
