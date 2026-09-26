// Фигуры для сцен вагона. Координаты общие для всех сцен: пол на y=200, сиденья на y=114–198.
// Цвета — литералы иллюстрации, а не токены интерфейса: сцена одинакова в любой теме

export type Face = "calm" | "smile" | "sad" | "angry" | "pale" | "out";
export type Arm = "down" | "up" | "reach" | "push" | "wave" | "phone" | "calm";
// Что проводник держит в правой руке
export type Holding = "radio" | "mic" | "water" | "pill" | "ticket";

// Лицо: глаза, рот и признаки состояния — пот у бледного, морщины гнева у злого
export function FaceMarks({ cx, cy, face }: { cx: number; cy: number; face: Face }) {
  const eyes =
    face === "out" ? (
      <g stroke="#555" strokeWidth="1.1" fill="none" strokeLinecap="round">
        <path d={`M${cx - 5} ${cy + 1} q2 1.6 4 0`} />
        <path d={`M${cx + 1} ${cy + 1} q2 1.6 4 0`} />
      </g>
    ) : (
      <g fill="#222">
        <circle cx={cx - 3} cy={cy + 1} r="1.3" />
        <circle cx={cx + 3.5} cy={cy + 1} r="1.3" />
      </g>
    );
  const mouth = {
    calm: `M${cx - 2} ${cy + 6} h4.5`,
    smile: `M${cx - 3} ${cy + 5} q3.2 3.4 6.4 0`,
    sad: `M${cx - 3} ${cy + 7.5} q3.2 -3 6.4 0`,
    angry: `M${cx - 3} ${cy + 7.5} q3.2 -3 6.4 0`,
    pale: `M${cx - 2.5} ${cy + 7} q2.8 -2.2 5.6 0`,
    out: `M${cx - 1.5} ${cy + 6} q1.5 1.5 3 0`,
  }[face];
  return (
    <g>
      {eyes}
      <path d={mouth} stroke="#7a3b2e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {face === "angry" && (
        <g stroke="#3a2a22" strokeWidth="1.4" strokeLinecap="round">
          <path d={`M${cx - 5} ${cy - 3} l4 1.6`} />
          <path d={`M${cx + 6} ${cy - 3} l-4 1.6`} />
        </g>
      )}
      {face === "pale" && <path className="motion-safe:animate-pulse" d={`M${cx + 9} ${cy - 6} q2.5 4 0 6 q-2.5 -2 0 -6 z`} fill="#7fb3e0" />}
    </g>
  );
}

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

const PALE_SKIN = "#dcd9be";

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

function ArmPath({ x, side, arm, coat, skin }: { x: number; side: -1 | 1; arm: Arm; coat: string; skin: string }) {
  const { d, hand } = armShape(x, side, arm);
  return (
    <g className={arm === "wave" ? "origin-bottom motion-safe:animate-car-wave [transform-box:fill-box]" : undefined}>
      <path d={d} stroke={coat} strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={skin} />
    </g>
  );
}

// Стоящий человек: x — центр, ноги на полу. flip — смотрит влево
export function Standing({
  x,
  coat,
  pants = "#2f3b4a",
  skin = "#f0c8a4",
  hair = "#6b4a34",
  face = "calm",
  left = "down",
  right = "down",
  hat,
  scarf,
  bag,
  suitcase,
  holding,
  flip,
}: {
  x: number;
  coat: string;
  pants?: string;
  skin?: string;
  hair?: string;
  face?: Face;
  left?: Arm;
  right?: Arm;
  hat?: "pilotka" | "cap";
  scarf?: string;
  bag?: boolean;
  suitcase?: boolean;
  holding?: Holding;
  flip?: boolean;
}) {
  const tone = face === "pale" ? PALE_SKIN : skin;
  return (
    <g transform={flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      {suitcase && (
        <g>
          <rect x={x + 13} y="166" width="16" height="30" rx="3" fill="#8a5a3c" />
          <path d={`M${x + 17} 166 v-5 h8 v5`} stroke="#5b3b27" strokeWidth="1.6" fill="none" />
        </g>
      )}
      <rect x={x - 8} y="160" width="7" height="38" rx="3" fill={pants} />
      <rect x={x + 1} y="160" width="7" height="38" rx="3" fill={pants} />
      <ellipse cx={x - 4} cy="199" rx="6" ry="2.6" fill="#1b2230" />
      <ellipse cx={x + 5} cy="199" rx="6" ry="2.6" fill="#1b2230" />
      <path d={`M${x - 13} 162 L${x - 9} 122 Q${x} 116 ${x + 9} 122 L${x + 13} 162 Z`} fill={coat} />
      {scarf && <path d={`M${x - 4} 119 L${x} 130 L${x + 4} 119 Z`} fill={scarf} />}
      <ArmPath x={x} side={-1} arm={left} coat={coat} skin={tone} />
      <ArmPath x={x} side={1} arm={right} coat={coat} skin={tone} />
      {bag && (
        <g>
          <rect x={x - 22} y="150" width="14" height="11" rx="2" fill="#b43c3c" />
          <rect x={x - 17} y="153" width="4" height="5" fill="#fff" />
        </g>
      )}
      <rect x={x - 3} y="110" width="6" height="8" fill={tone} />
      <circle cx={x} cy="103" r="10" fill={tone} />
      <path d={`M${x - 10} 102 Q${x - 9} 91 ${x} 91 Q${x + 10} 91 ${x + 10} 102 Q${x + 6} 96 ${x} 96 Q${x - 6} 96 ${x - 10} 102 Z`} fill={hair} />
      {hat === "pilotka" && <path d={`M${x - 10} 95 L${x + 10} 93 L${x + 9} 88 Q${x} 84 ${x - 9} 89 Z`} fill={coat} />}
      {hat === "cap" && (
        <g fill="#141c2b">
          <path d={`M${x - 10} 95 Q${x} 84 ${x + 10} 95 Z`} />
          <rect x={x - 2} y="94" width="15" height="3" rx="1.5" />
        </g>
      )}
      <FaceMarks cx={x + 1} cy={102} face={face} />
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
    <Standing x={x} coat="#23406b" pants="#1e2c45" hat="pilotka" scarf="#2a9d8f" right={right} left={left} face={face} holding={holding} flip={flip} />
  );
}

export type SeatedArm = "lap" | "chest" | "wave";

// Сидящий пассажир: x — центр кресла. slump — сполз в кресле (плавный наклон)
export function Seated({
  x,
  coat,
  skin = "#e6c9a8",
  hair = "#2f2a26",
  face = "calm",
  arm = "lap",
  slump,
}: {
  x: number;
  coat: string;
  skin?: string;
  hair?: string;
  face?: Face;
  arm?: SeatedArm;
  slump?: boolean;
}) {
  const tone = face === "pale" || face === "out" ? PALE_SKIN : skin;
  const arms = {
    lap: { d: `M${x - 10} 150 Q${x - 4} 162 ${x + 5} 164`, hand: [x + 6, 164] },
    chest: { d: `M${x - 11} 158 Q${x - 4} 150 ${x + 1} 155`, hand: [x + 1, 156] },
    wave: { d: `M${x - 10} 154 Q${x - 20} 140 ${x - 16} 124`, hand: [x - 16, 122] },
  }[arm];
  return (
    <g className="origin-bottom transition-transform duration-700 [transform-box:fill-box]" style={{ transform: slump ? "rotate(9deg)" : undefined }}>
      <path d={`M${x - 14} 186 L${x - 17} 199 L${x - 7} 199 L${x - 4} 186 Z`} fill="#4e4a45" />
      <path d={`M${x + 2} 186 L${x} 199 L${x + 10} 199 L${x + 11} 186 Z`} fill="#4e4a45" />
      <path d={`M${x - 19} 186 Q${x - 21} 156 ${x - 10} 146 L${x + 10} 146 Q${x + 21} 156 ${x + 19} 186 Z`} fill={coat} />
      <g className={arm === "wave" ? "origin-bottom motion-safe:animate-car-wave [transform-box:fill-box]" : undefined}>
        <path d={arms.d} stroke={coat} strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx={arms.hand[0]} cy={arms.hand[1]} r="3.4" fill={tone} />
      </g>
      <rect x={x - 3} y="137" width="6" height="9" fill={tone} />
      <circle cx={x} cy="129" r="11" fill={tone} />
      <path d={`M${x - 11} 127 Q${x - 11} 117 ${x} 117 Q${x + 11} 117 ${x + 11} 127 Q${x + 6} 121 ${x} 121 Q${x - 6} 121 ${x - 11} 127 Z`} fill={hair} />
      <FaceMarks cx={x + 1} cy={128} face={face} />
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
            <g className="motion-safe:animate-car-speed" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
              <line x1={inner + 20} y1="92" x2={inner + 70} y2="92" />
              <line x1={inner + 60} y1="99" x2={inner + 120} y2="99" />
              <line x1={inner + 14} y1="105" x2={inner + 50} y2="105" />
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
