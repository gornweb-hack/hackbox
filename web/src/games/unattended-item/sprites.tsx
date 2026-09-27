import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bust } from "@/components/run/novel/bust";
import { type Emotion, Head, LOOKS } from "@/components/run/scene/head";

// Спрайты мини-игры — те же персонажи, что в сценариях: компоненты Head и Bust рендерятся в SVG
// и превращаются в картинки, которые Phaser берёт как текстуры. Поменяли внешность в head.tsx —
// поменялась и в игре

export type Look = keyof typeof LOOKS;
export type Sprites = Map<string, HTMLImageElement>;

// Пассажиры в креслах и проводник: головы в двух эмоциях, встревоженная — при лишней тревоге
export const PASSENGER_LOOKS: Look[] = ["man", "woman", "redhead", "neighbour", "elder"];
const HEAD_EMOTIONS: Emotion[] = ["calm", "worried"];

// Кто говорит в диалогах игры: внешность, цвет одежды и эмоция бюста
export const SPEAKERS = {
  neighbour: { look: "neighbour", coat: "#a8462f", emotion: "calm", name: "Алова", role: "пассажирка" },
  elder: { look: "elder", coat: "#6d727a", emotion: "worried", name: "Серов", role: "пассажир" },
  tea: { look: "woman", coat: "#b0506e", emotion: "smile", name: "Пассажирка", role: "место 3В" },
  grabber: { look: "man", coat: "#8a6fb0", emotion: "angry", name: "Пассажир", role: "место 6А" },
} as const satisfies Record<string, { look: Look; coat: string; emotion: Emotion; name: string; role: string }>;

export type Speaker = keyof typeof SPEAKERS;

export const headKey = (look: Look | "conductor", emotion: Emotion) => `head:${look}:${emotion}`;
export const bustKey = (speaker: Speaker) => `bust:${speaker}`;

// Размер картинок в пикселях: головы 112×156 (вьюбокс лица с запасом под причёску и шапку),
// бюсты 160×222 — как в плеере-новелле
const HEAD_VIEW = { box: "44 40 112 156", width: 112, height: 156 };
const BUST_VIEW = { width: 160, height: 222 };

function toImage(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
}

function headSvg(look: Look | "conductor", emotion: Emotion) {
  const markup = renderToStaticMarkup(<Head look={LOOKS[look]} emotion={emotion} x={100} bottom={190} height={110} />);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${HEAD_VIEW.box}" width="${HEAD_VIEW.width}" height="${HEAD_VIEW.height}">${markup}</svg>`;
}

function bustSvg(speaker: Speaker) {
  const { look, coat, emotion } = SPEAKERS[speaker];
  const element: ReactElement = <Bust look={LOOKS[look]} coat={coat} emotion={emotion} />;
  // Bust рисует свой <svg> без xmlns и размеров — картинке они нужны
  return renderToStaticMarkup(element).replace("<svg", `<svg xmlns="http://www.w3.org/2000/svg" width="${BUST_VIEW.width}" height="${BUST_VIEW.height}"`);
}

export async function loadSprites(): Promise<Sprites> {
  const jobs: [string, string][] = [];
  for (const look of [...PASSENGER_LOOKS, "conductor" as const]) {
    for (const emotion of HEAD_EMOTIONS) jobs.push([headKey(look, emotion), headSvg(look, emotion)]);
  }
  for (const speaker of Object.keys(SPEAKERS) as Speaker[]) jobs.push([bustKey(speaker), bustSvg(speaker)]);
  const images = await Promise.all(jobs.map(([, svg]) => toImage(svg)));
  return new Map(jobs.map(([key], index) => [key, images[index]]));
}
