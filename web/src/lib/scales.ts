// Шкалы «Лояльность пассажира» и «Рейтинг безопасности»: 0–100 и три зоны, как в макете.
// Красный, жёлтый и зелёный в интерфейсе — только для этих зон

export type ScaleName = "loyalty" | "safety";

export const SCALE_TITLES: Record<ScaleName, string> = {
  loyalty: "Лояльность пассажира",
  safety: "Рейтинг безопасности",
};

export interface Zone {
  tone: "red" | "yellow" | "green";
  label: string;
}

export function zoneOf(value: number): Zone {
  if (value <= 30) return { tone: "red", label: "Риск · 0–30" };
  if (value <= 60) return { tone: "yellow", label: "Внимание · 31–60" };
  return { tone: "green", label: "Норма · 61–100" };
}

// «+15», «−20» — с настоящим минусом, а не дефисом
export function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : "0";
}
