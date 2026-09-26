// Голова персонажа в стиле портретных карточек: вытянутое лицо, разделённое на светлую и теневую
// половину, нос-полоска, румянец, геометрическая причёска. Рисуется в своей системе координат
// 200×260 (лицо — x 62–138, y 80–190) и масштабируется под фигурку в сцене

export type Emotion = "calm" | "smile" | "worried" | "angry" | "pain";

type HairStyle = "bun" | "bald" | "long" | "short" | "bob" | "crop";

// Ворот одежды: рубашка с галстуком и лацканами, водолазка, жемчуг, открытый ворот, форменный платок
export type Neckline =
  | { kind: "shirt"; tie: string }
  | { kind: "turtle" }
  | { kind: "pearls" }
  | { kind: "open" }
  | { kind: "scarf"; color: string };

export interface Look {
  skinLight: string;
  skinShade: string;
  hair: string;
  style: HairStyle;
  hat?: { kind: "pilotka" | "cap"; color: string; accent: string };
  glasses?: boolean;
  wrinkles?: boolean;
  neck: Neckline;
}

// Внешности персонажей тренажёра. Имена вымышленные: только синтетические данные
export const LOOKS = {
  // Проводница Бирюзова: пучок, пилотка с бирюзовым кантом
  conductor: {
    skinLight: "#f6cfae",
    skinShade: "#e9b893",
    hair: "#4a2f25",
    style: "bun",
    hat: { kind: "pilotka", color: "#23406b", accent: "#2a9d8f" },
    neck: { kind: "scarf", color: "#2a9d8f" },
  },
  // Сотрудник ПТБ Горчаков: чёрная фуражка
  guard: { skinLight: "#eec39c", skinShade: "#d9a67c", hair: "#2b211c", style: "short", hat: { kind: "cap", color: "#1b1d22", accent: "#c9892f" }, neck: { kind: "shirt", tie: "#8a2b2b" } },
  // Пожилой пассажир Серов: лысина, очки, морщины
  elder: { skinLight: "#f1d6bd", skinShade: "#dcbd9f", hair: "#d8d8d8", style: "bald", glasses: true, wrinkles: true, neck: { kind: "shirt", tie: "#4f6284" } },
  // Соседка Алова: длинные тёмные волосы
  neighbour: { skinLight: "#f6d3b8", skinShade: "#e8bc9a", hair: "#231a2e", style: "long", neck: { kind: "pearls" } },
  // Обычные пассажиры для второстепенных ролей
  man: { skinLight: "#f0cba8", skinShade: "#ddb28c", hair: "#3a2e26", style: "crop", neck: { kind: "turtle" } },
  redhead: { skinLight: "#f7d8c0", skinShade: "#e9c2a4", hair: "#b0532c", style: "short", glasses: true, neck: { kind: "open" } },
  woman: { skinLight: "#f7d8c0", skinShade: "#e9c2a4", hair: "#8c4a2f", style: "bob", neck: { kind: "open" } },
} satisfies Record<string, Look>;

const PALE = { skinLight: "#e4e2cc", skinShade: "#d1cfb6" };

function HairBack({ look }: { look: Look }) {
  switch (look.style) {
    case "long":
      return <path d="M52 122 Q50 68 100 66 Q150 68 148 122 L150 200 L50 200 Z" fill={look.hair} />;
    case "bob":
      return <path d="M56 128 Q54 72 100 70 Q146 72 144 128 L146 172 L54 172 Z" fill={look.hair} />;
    case "bun":
      return <circle cx="100" cy="66" r="15" fill={look.hair} />;
    default:
      return null;
  }
}

function HairFront({ look }: { look: Look }) {
  switch (look.style) {
    case "bun":
      return <path d="M61 118 Q60 74 100 74 Q140 74 139 118 Q128 94 100 94 Q72 94 61 118Z" fill={look.hair} />;
    case "bald":
      return (
        <g fill={look.hair}>
          <rect x="59" y="112" width="9" height="28" rx="4.5" />
          <rect x="132" y="112" width="9" height="28" rx="4.5" />
        </g>
      );
    case "long":
      return <path d="M62 114 Q64 78 100 78 Q130 78 139 104 Q118 92 96 100 Q76 108 62 114Z" fill={look.hair} />;
    case "short":
      return <path d="M62 110 Q62 84 100 82 Q138 84 138 110 L132 100 Q100 92 68 100Z" fill={look.hair} />;
    case "bob":
      return <path d="M60 118 Q62 78 100 78 Q138 78 140 118 Q120 96 104 98 Q86 100 60 118Z" fill={look.hair} />;
    case "crop":
      return <path d="M62 108 Q64 80 100 80 Q136 80 138 108 Q120 96 100 96 Q80 96 62 108Z" fill={look.hair} />;
  }
}

function Hat({ hat }: { hat: NonNullable<Look["hat"]> }) {
  if (hat.kind === "pilotka") {
    return (
      <g>
        <path d="M64 96 L138 88 L134 74 Q100 62 68 80 Z" fill={hat.color} />
        <path d="M65 93 L137 85" stroke={hat.accent} strokeWidth="2.5" />
      </g>
    );
  }
  return (
    <g>
      <path d="M60 90 Q100 52 140 90 Z" fill={hat.color} />
      <rect x="60" y="86" width="80" height="9" fill={hat.color} />
      <path d="M58 95 Q100 104 142 95 L142 99 Q100 108 58 99Z" fill="#0f1116" />
      <circle cx="100" cy="78" r="6" fill={hat.accent} />
    </g>
  );
}

// Глаза, брови и рот по эмоции. Злость и «плохо» дополняются знаком над головой в сцене
function Features({ emotion }: { emotion: Emotion }) {
  const ink = "#1d1a22";
  const mouth = "#b5483e";
  const eyes = {
    calm: (
      <g fill={ink}>
        <circle cx="86" cy="130" r="3.4" />
        <circle cx="114" cy="130" r="3.4" />
      </g>
    ),
    smile: <path d="M81 131 q5 -6 10 0 M109 131 q5 -6 10 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />,
    worried: (
      <g>
        <circle cx="86" cy="131" r="4" fill="#fff" />
        <circle cx="114" cy="131" r="4" fill="#fff" />
        <circle cx="86" cy="131" r="2.4" fill={ink} />
        <circle cx="114" cy="131" r="2.4" fill={ink} />
      </g>
    ),
    angry: (
      <g fill={ink}>
        <circle cx="86" cy="131" r="3" />
        <circle cx="114" cy="131" r="3" />
      </g>
    ),
    pain: <path d="M81 130 q5 4 10 0 M109 130 q5 4 10 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />,
  }[emotion];
  const brows = {
    calm: "M80 119 h13 M107 119 h13",
    smile: "M80 117 h13 M107 117 h13",
    worried: "M79 121 L93 115 M121 121 L107 115",
    angry: "M79 116 L93 122 M121 116 L107 122",
    pain: "M79 120 L93 116 M121 120 L107 116",
  }[emotion];
  const lips = {
    calm: <path d="M92 164 h16" stroke={mouth} strokeWidth="3" strokeLinecap="round" />,
    smile: <path d="M87 159 q13 14 26 0 z" fill={mouth} />,
    worried: <ellipse cx="100" cy="165" rx="4.5" ry="5.5" fill={mouth} />,
    angry: <path d="M89 167 q11 -8 22 0" stroke={mouth} strokeWidth="3.2" fill="none" strokeLinecap="round" />,
    pain: <path d="M92 166 q8 -5 16 0" stroke={mouth} strokeWidth="3" fill="none" strokeLinecap="round" />,
  }[emotion];
  return (
    <g>
      <g className="origin-center motion-safe:animate-car-blink [transform-box:fill-box]">{eyes}</g>
      <path d={brows} stroke="#2a211c" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      {lips}
      {emotion === "pain" && <path d="M136 104 q5 8 0 12 q-5 -4 0 -12z" fill="#7fb3e0" />}
    </g>
  );
}

// Голова в сцене: x — центр, bottom — где кончается подбородок, height — высота лица.
// pale — бледная кожа, когда пассажиру плохо
export function Head({
  look,
  emotion,
  x,
  bottom,
  height,
  pale,
}: {
  look: Look;
  emotion: Emotion;
  x: number;
  bottom: number;
  height: number;
  pale?: boolean;
}) {
  const s = height / 110;
  const light = pale ? PALE.skinLight : look.skinLight;
  const shade = pale ? PALE.skinShade : look.skinShade;
  return (
    <g transform={`translate(${x - 100 * s} ${bottom - 190 * s}) scale(${s})`}>
      <HairBack look={look} />
      <circle cx="62" cy="136" r="9" fill={light} />
      <circle cx="138" cy="136" r="9" fill={shade} />
      <rect x="62" y="80" width="76" height="110" rx="38" fill={light} />
      {/* Правая половина лица в тени — главный приём стиля */}
      <path d="M100 80 A38 38 0 0 1 138 118 L138 152 A38 38 0 0 1 100 190 Z" fill={shade} />
      {look.wrinkles && <path d="M84 96 h32 M88 102 h24" stroke="#caa888" strokeWidth="1.6" strokeLinecap="round" />}
      <HairFront look={look} />
      <circle cx="79" cy="152" r="7" fill="#f29a8c" opacity="0.5" />
      <circle cx="121" cy="152" r="7" fill="#f29a8c" opacity="0.5" />
      <rect x="96" y="124" width="8" height="26" rx="4" fill="#ee8a78" />
      <Features emotion={emotion} />
      {look.glasses && (
        <g stroke="#2a211c" strokeWidth="1.8" fill="none">
          <circle cx="86" cy="131" r="9" />
          <circle cx="114" cy="131" r="9" />
          <path d="M95 130 h10 M77 129 l-14 -3 M123 129 l14 -3" />
        </g>
      )}
      {look.hat && <Hat hat={look.hat} />}
    </g>
  );
}
