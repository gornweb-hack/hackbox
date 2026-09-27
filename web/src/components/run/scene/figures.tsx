import { type Emotion, Head, LOOKS, type Look, type Neckline } from "./head";

// Фигуры для сцен вагона. Координаты общие для всех сцен: пол на y=200, сиденья на y=114–198.
// Цвета — литералы иллюстрации, а не токены интерфейса: сцена одинакова в любой теме

// Состояние лица в сцене. pale и out — пассажиру плохо: лицо бледнеет, эмоция «плохо»
export type Face = "calm" | "smile" | "sad" | "angry" | "pale" | "out";

const EMOTIONS: Record<Face, Emotion> = { calm: "calm", smile: "smile", sad: "worried", angry: "angry", pale: "pain", out: "pain" };
const isPale = (face: Face) => face === "pale" || face === "out";
const PALE_HAND = "#e4e2cc";

// Теневая сторона цвета: как на лицах, у одежды правая половина темнее
export function shade(hex: string, amount = 0.18) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`;
}

// Ворот у верхнего края туловища: x — центр, top — линия плеч. Им же пользуется бюст новеллы
export function Collar({ x, top, neck, coat, skin }: { x: number; top: number; neck: Neckline; coat: string; skin: string }) {
  switch (neck.kind) {
    case "shirt":
      return (
        <g>
          <path d={`M${x - 6} ${top} L${x} ${top + 13} L${x + 6} ${top} Z`} fill="#fff" />
          <path d={`M${x - 1.3} ${top + 2} h2.6 l1 9 l-2.3 2.4 l-2.3 -2.4 Z`} fill={neck.tie} />
          <path d={`M${x - 6} ${top} L${x - 9} ${top + 5} L${x - 1} ${top + 15} Z`} fill={shade(coat, 0.35)} />
          <path d={`M${x + 6} ${top} L${x + 9} ${top + 5} L${x + 1} ${top + 15} Z`} fill={shade(coat, 0.45)} />
        </g>
      );
    case "turtle":
      return <rect x={x - 6} y={top - 2.5} width="12" height="5" rx="2.5" fill={shade(coat, 0.25)} />;
    case "pearls":
      return (
        <g fill="#fbf8f2">
          {[-5, -2.5, 0, 2.5, 5].map((dx) => (
            <circle key={dx} cx={x + dx} cy={top + 2 + (5 - Math.abs(dx)) * 0.4} r="1.2" />
          ))}
        </g>
      );
    case "open":
      return <path d={`M${x - 4.5} ${top} L${x} ${top + 8} L${x + 4.5} ${top} Z`} fill={skin} />;
    case "stethoscope":
      return (
        <g>
          <path d={`M${x - 4.5} ${top} L${x} ${top + 8} L${x + 4.5} ${top} Z`} fill={skin} />
          <path d={`M${x - 6} ${top + 1} Q${x - 7} ${top + 11} ${x - 1} ${top + 13} M${x + 6} ${top + 1} Q${x + 7} ${top + 11} ${x + 1} ${top + 13}`} stroke="#3c4250" strokeWidth="1.3" fill="none" />
          <circle cx={x} cy={top + 14} r="1.8" fill="#9aa3ad" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path d={`M${x - 6} ${top} L${x} ${top + 12} L${x + 6} ${top} Z`} fill="#fff" />
          <path d={`M${x - 3.5} ${top + 1} L${x} ${top + 8} L${x + 3.5} ${top + 1} Z`} fill={neck.color} />
          <path d={`M${x} ${top + 7} l-3 6 h6 Z`} fill={shade(neck.color, 0.2)} />
        </g>
      );
  }
}

// Туловище в стиле портретов: скруглённые плечи, правая половина в тени, ворот персонажа
function Torso({ x, top, bottom, half, coat, look }: { x: number; top: number; bottom: number; half: number; coat: string; look: Look }) {
  const shoulder = top + 9;
  return (
    <g>
      <path d={`M${x - half} ${bottom} L${x - half} ${shoulder} Q${x - half} ${top + 1} ${x - half + 8} ${top} L${x + half - 8} ${top} Q${x + half} ${top + 1} ${x + half} ${shoulder} L${x + half} ${bottom} Z`} fill={coat} />
      <path d={`M${x} ${top} L${x + half - 8} ${top} Q${x + half} ${top + 1} ${x + half} ${shoulder} L${x + half} ${bottom} L${x} ${bottom} Z`} fill={shade(coat)} />
      <Collar x={x} top={top} neck={look.neck} coat={coat} skin={look.skinShade} />
    </g>
  );
}
export type Arm = "down" | "up" | "reach" | "push" | "wave" | "phone" | "calm";
// Что проводник держит в правой руке
export type Holding = "radio" | "mic" | "water" | "pill" | "ticket";

// Знак сильной эмоции над головой: гнев — три красные чёрточки, тревога — жёлтые
export function Burst({ cx, cy, tone }: { cx: number; cy: number; tone: "anger" | "worry" }) {
  return (
    <g stroke={tone === "anger" ? "#d63b3b" : "#e0a33a"} strokeWidth="1.8" strokeLinecap="round" className="motion-safe:animate-pulse">
      <line x1={cx - 11} y1={cy - 16} x2={cx - 15} y2={cy - 22} />
      <line x1={cx} y1={cy - 19} x2={cx} y2={cy - 26} />
      <line x1={cx + 11} y1={cy - 16} x2={cx + 15} y2={cy - 22} />
    </g>
  );
}

// Форма руки: путь от плеча и где кисть. side: -1 — левая рука, 1 — правая
function armShape(x: number, s: -1 | 1, arm: Arm): { d: string; hand: [number, number] } {
  switch (arm) {
    case "down":
      return { d: `M${x + 9 * s} 126 Q${x + 15 * s} 142 ${x + 11 * s} 156`, hand: [x + 11 * s, 157] };
    case "up":
    case "wave":
      return { d: `M${x + 9 * s} 126 Q${x + 18 * s} 116 ${x + 16 * s} 102`, hand: [x + 16 * s, 100] };
    case "reach":
      return { d: `M${x + 8 * s} 127 Q${x + 22 * s} 128 ${x + 32 * s} 122`, hand: [x + 33 * s, 121] };
    case "push":
      return { d: `M${x + 8 * s} 127 Q${x + 12 * s} 142 ${x + 11 * s} 152`, hand: [x + 12 * s, 154] };
    case "phone":
      return { d: `M${x + 9 * s} 126 Q${x + 17 * s} 118 ${x + 8 * s} 107`, hand: [x + 7 * s, 106] };
    case "calm":
      return { d: `M${x + 8 * s} 127 Q${x + 18 * s} 138 ${x + 28 * s} 138`, hand: [x + 29 * s, 138] };
  }
}

// Предмет в руке: рация и микрофон у лица, вода, таблетка и билет в протянутой руке
function HeldItem({ at: [hx, hy], item }: { at: [number, number]; item: Holding }) {
  switch (item) {
    case "radio":
      return (
        <g>
          <rect x={hx - 3} y={hy - 9} width="6" height="12" rx="1.5" fill="#20242c" />
          <rect x={hx + 1} y={hy - 14} width="1.5" height="6" fill="#20242c" />
          <g stroke="#1f5bff" strokeWidth="1.3" fill="none" strokeLinecap="round" className="motion-safe:animate-pulse">
            <path d={`M${hx + 6} ${hy - 12} q4 3 0 7`} />
            <path d={`M${hx + 10} ${hy - 15} q6 6 0 13`} />
          </g>
        </g>
      );
    case "mic":
      return (
        <g>
          <rect x={hx - 1.5} y={hy - 4} width="3" height="8" fill="#20242c" />
          <circle cx={hx} cy={hy - 6} r="3" fill="#5b6773" />
        </g>
      );
    case "water":
      return (
        <g>
          <rect x={hx - 3} y={hy - 14} width="7" height="14" rx="2" fill="#9ccbf0" />
          <rect x={hx - 1.5} y={hy - 17} width="4" height="3" fill="#1f5bff" />
        </g>
      );
    case "pill":
      return <ellipse cx={hx + 4} cy={hy - 5} rx="4.5" ry="2.8" fill="#fff" stroke="#b43c3c" strokeWidth="1" />;
    case "ticket":
      return <rect x={hx} y={hy - 9} width="12" height="8" rx="1" fill="#f4e7c3" stroke="#c9a34a" strokeWidth="0.8" />;
  }
}

// Рука: левая (дальняя) в тени, правая — в цвете одежды, как половины туловища
function ArmPath({ x, side, arm, coat, skin }: { x: number; side: -1 | 1; arm: Arm; coat: string; skin: string }) {
  const { d, hand } = armShape(x, side, arm);
  return (
    <g className={arm === "wave" ? "origin-bottom motion-safe:animate-car-wave [transform-box:fill-box]" : undefined}>
      <path d={d} stroke={side === 1 ? coat : shade(coat, 0.25)} strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={skin} />
    </g>
  );
}

// Стоящий человек: x — центр, ноги на полу. flip — смотрит влево
export function Standing({
  x,
  coat,
  pants = "#2f3b4a",
  look,
  face = "calm",
  left = "down",
  right = "down",
  bag,
  suitcase,
  holding,
  flip,
}: {
  x: number;
  coat: string;
  pants?: string;
  look: Look;
  face?: Face;
  left?: Arm;
  right?: Arm;
  bag?: boolean;
  suitcase?: boolean;
  holding?: Holding;
  flip?: boolean;
}) {
  const tone = isPale(face) ? PALE_HAND : look.skinLight;
  return (
    <g transform={flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      {suitcase && (
        <g>
          <rect x={x + 13} y="166" width="16" height="30" rx="3" fill="#8a5a3c" />
          <path d={`M${x + 17} 166 v-5 h8 v5`} stroke="#5b3b27" strokeWidth="1.6" fill="none" />
        </g>
      )}
      <rect x={x - 9} y="158" width="8" height="40" rx="2" fill={pants} />
      <rect x={x + 1} y="158" width="8" height="40" rx="2" fill={shade(pants)} />
      <path d={`M${x - 11} 200 v-3 a3 3 0 0 1 3 -3 h7 v6 Z`} fill="#15181f" />
      <path d={`M${x + 1} 194 h7 a3 3 0 0 1 3 3 v3 h-10 Z`} fill="#15181f" />
      <Torso x={x} top={119} bottom={162} half={15} coat={coat} look={look} />
      <ArmPath x={x} side={-1} arm={left} coat={coat} skin={tone} />
      <ArmPath x={x} side={1} arm={right} coat={coat} skin={tone} />
      {bag && (
        <g>
          <rect x={x - 22} y="150" width="14" height="11" rx="2" fill="#b43c3c" />
          <rect x={x - 17} y="153" width="4" height="5" fill="#fff" />
        </g>
      )}
      <Head look={look} emotion={EMOTIONS[face]} pale={isPale(face)} x={x} bottom={120} height={28} />
      {holding && <HeldItem at={armShape(x, 1, right).hand} item={holding} />}
    </g>
  );
}

// Проводник: форма, пилотка, бирюзовый платок
export function Conductor({
  x,
  right = "push",
  left = "down",
  face = "calm",
  holding,
  flip,
}: {
  x: number;
  right?: Arm;
  left?: Arm;
  face?: Face;
  holding?: Holding;
  flip?: boolean;
}) {
  return (
    <Standing x={x} coat="#23406b" pants="#1e2c45" look={LOOKS.conductor} right={right} left={left} face={face} holding={holding} flip={flip} />
  );
}

export type SeatedArm = "lap" | "chest" | "wave";

// Сидящий пассажир: x — центр кресла. slump — сполз в кресле (плавный наклон)
export function Seated({
  x,
  coat,
  look,
  face = "calm",
  arm = "lap",
  slump,
}: {
  x: number;
  coat: string;
  look: Look;
  face?: Face;
  arm?: SeatedArm;
  slump?: boolean;
}) {
  const tone = isPale(face) ? PALE_HAND : look.skinLight;
  const arms = {
    lap: { d: `M${x - 10} 150 Q${x - 4} 162 ${x + 5} 164`, hand: [x + 6, 164] },
    chest: { d: `M${x - 11} 158 Q${x - 4} 150 ${x + 1} 155`, hand: [x + 1, 156] },
    wave: { d: `M${x - 10} 154 Q${x - 20} 140 ${x - 16} 124`, hand: [x - 16, 122] },
  }[arm];
  return (
    <g className="origin-bottom transition-transform duration-700 [transform-box:fill-box]" style={{ transform: slump ? "rotate(9deg)" : undefined }}>
      <rect x={x - 14} y="184" width="9" height="15" rx="2" fill="#4e4a45" />
      <rect x={x + 2} y="184" width="9" height="15" rx="2" fill={shade("#4e4a45")} />
      <Torso x={x} top={146} bottom={187} half={19} coat={coat} look={look} />
      <g className={arm === "wave" ? "origin-bottom motion-safe:animate-car-wave [transform-box:fill-box]" : undefined}>
        <path d={arms.d} stroke={shade(coat, 0.25)} strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx={arms.hand[0]} cy={arms.hand[1]} r="3.4" fill={tone} />
      </g>
      <Head look={look} emotion={EMOTIONS[face]} pale={isPale(face)} x={x} bottom={148} height={30} />
    </g>
  );
}

export function Seat({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x + 8} 124 Q${x + 8} 114 ${x + 18} 114 L${x + 62} 114 Q${x + 72} 114 ${x + 72} 124 L${x + 74} 186 L${x + 6} 186 Z`} fill="#3d5a87" />
      <rect x={x + 21} y="118" width="38" height="17" rx="4" fill="#f3f5f7" />
      <rect x={x} y="180" width="80" height="18" rx="5" fill="#34507a" />
    </g>
  );
}

// Тележка с напитками; x — левый край. Стаканчики подрагивают на ходу
export function Trolley({ x, bob }: { x: number; bob?: string }) {
  return (
    <g>
      <rect x={x} y="160" width="54" height="40" rx="4" fill="#b9c2cc" />
      <rect x={x} y="157" width="54" height="6" rx="3" fill="#98a3af" />
      <g className={bob}>
        <rect x={x + 6} y="145" width="8" height="12" rx="1.5" fill="#fff" />
        <rect x={x + 17} y="145" width="8" height="12" rx="1.5" fill="#fff" />
        <rect x={x + 30} y="141" width="6" height="16" rx="1.5" fill="#5e8fbf" />
        <rect x={x + 39} y="143" width="10" height="14" rx="2" fill="#e8b04b" />
      </g>
      <circle cx={x + 8} cy="203" r="4" fill="#4b5561" />
      <circle cx={x + 46} cy="203" r="4" fill="#4b5561" />
    </g>
  );
}

// Ширина повторяющегося узора облаков; совпадает со сдвигом в анимации car-speed (globals.css)
const SPEED_PERIOD = 100;

// Окно салона: в пути за ним летит пейзаж, на стоянке видна платформа
export function Window({ x, width, clipId, station }: { x: number; width: number; clipId: string; station?: boolean }) {
  const inner = x + 5;
  const right = x + width - 5;
  return (
    <g>
      <clipPath id={clipId}>
        <rect x={inner} y="84" width={width - 10} height="40" rx="9" />
      </clipPath>
      <rect x={x} y="80" width={width} height="48" rx="12" fill="#a9bccd" />
      <rect x={inner} y="84" width={width - 10} height="40" rx="9" fill="#d7e7f3" />
      <g clipPath={`url(#${clipId})`}>
        {station ? (
          <g>
            <rect x={inner} y="108" width={width - 10} height="16" fill="#aab3bd" />
            <rect x={inner} y="106" width={width - 10} height="3" fill="#e3c14a" />
            <rect x={inner + width / 2 - 8} y="84" width="6" height="24" fill="#7c8894" />
          </g>
        ) : (
          <g>
            <path d={`M${inner} 110 Q${inner + 50} 104 ${inner + 90} 110 T${right} 108 L${right} 124 L${inner} 124 Z`} fill="#a9cf9a" />
            <path d={`M${inner} 117 Q${inner + 70} 113 ${right} 117 L${right} 124 L${inner} 124 Z`} fill="#86b77b" />
            {/* Узор облаков повторяется через SPEED_PERIOD и сдвигается ровно на период — цикл без скачка */}
            <g className="motion-safe:animate-car-speed" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
              {[0, 1, 2].map((copy) => (
                <g key={copy} transform={`translate(${inner + copy * SPEED_PERIOD} 0)`}>
                  <line x1="10" y1="92" x2="55" y2="92" />
                  <line x1="45" y1="99" x2="95" y2="99" />
                  <line x1="4" y1="105" x2="36" y2="105" />
                </g>
              ))}
            </g>
          </g>
        )}
      </g>
    </g>
  );
}

// Салон: стена, два окна и пол
export function Interior({ clip, station }: { clip: string; station?: boolean }) {
  return (
    <g>
      <rect y="74" width="400" height="144" fill="#e9edf3" />
      <Window x={16} width={140} clipId={`${clip}-l`} station={station} />
      <Window x={232} width={152} clipId={`${clip}-r`} station={station} />
      <rect y="200" width="400" height="18" fill="#8f9aa6" />
      <rect y="200" width="400" height="3" fill="#7c8894" />
    </g>
  );
}
