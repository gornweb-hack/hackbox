import { Collar, shade } from "../scene/figures";
import { type Emotion, Head, type Look } from "../scene/head";

// Персонаж новеллы по пояс. Голова и ворот — те же компоненты, что у фигурок в сцене вагона,
// только крупнее: голова рисуется в натуральную величину своей системы координат (лицо 76×110)
export function Bust({ look, coat, emotion, pale }: { look: Look; coat: string; emotion: Emotion; pale?: boolean }) {
  return (
    <svg viewBox="20 40 160 222" aria-hidden className="block h-auto w-full">
      <path d="M28 262 Q30 214 70 204 L130 204 Q170 214 172 262 Z" fill={coat} />
      <path d="M100 204 L130 204 Q170 214 172 262 L100 262 Z" fill={shade(coat)} />
      <rect x="88" y="176" width="24" height="30" fill={look.skinShade} />
      <g transform="translate(100 204) scale(2.3)">
        <Collar x={0} top={0} neck={look.neck} coat={coat} skin={look.skinShade} />
      </g>
      <Head look={look} emotion={emotion} pale={pale} x={100} bottom={190} height={110} />
    </svg>
  );
}
