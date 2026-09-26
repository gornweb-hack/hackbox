// Геометрия спидометра из макета: центр (150, 148), радиус 120, шкала 0–400 км/ч на дуге 220°.
// 0 км/ч — угол 200°, 400 км/ч — −20° (углы от оси X против часовой стрелки)

export const CENTER = { x: 150, y: 148 };
export const RADIUS = 120;
export const MAX_SPEED = 400;

const round = (value: number) => value.toFixed(2);

export function angleOf(speed: number): number {
  return ((200 - (220 * speed) / MAX_SPEED) * Math.PI) / 180;
}

// Точка на шкале: скорость и расстояние от центра
export function pointAt(speed: number, radius: number): [number, number] {
  const angle = angleOf(speed);
  return [CENTER.x + radius * Math.cos(angle), CENTER.y - radius * Math.sin(angle)];
}

// Дуга шкалы от from до to км/ч. Слишком короткую не рисуем — от неё остаётся точка
export function arcPath(from: number, to: number, radius = RADIUS): string {
  if (to - from < 0.3) return "";
  const [x1, y1] = pointAt(from, radius);
  const [x2, y2] = pointAt(to, radius);
  const large = (220 * (to - from)) / MAX_SPEED > 180 ? 1 : 0;
  return `M${round(x1)} ${round(y1)}A${radius} ${radius} 0 ${large} 1 ${round(x2)} ${round(y2)}`;
}

// Засечка на скорости speed: отрезок от радиуса inner до outer
export function tickPath(speed: number, inner: number, outer: number): string {
  const [x1, y1] = pointAt(speed, inner);
  const [x2, y2] = pointAt(speed, outer);
  return `M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`;
}
