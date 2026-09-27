import type { PointerEvent } from "react";
import { type Emotion, Head, LOOKS } from "@/components/run/scene/head";
import type { InspectionState } from "@/games/unattended-item/flow";
import { AISLE_X, type Bag, type Car, type Look, ROW_STEP, ROW_Y0, ROWS, SEAT_X, type Spot, WIDTH } from "@/games/unattended-item/layout";

// Видимая часть вагона: шапка игры закрывает верх, поэтому рисуем от 80 px
const TOP = 80;
const VIEW_HEIGHT = 720;
// Куда откатывают игрушку при «убрать с прохода» — к креслам слева
const CLEAR_SHIFT = SEAT_X[0] - AISLE_X + 40;

const COLORS = {
  floor: "#e9edf3",
  wall: "#c5cbd4",
  aisle: "#f6f7f9",
  seat: "#3d5a87",
  headrest: "#f3f5f7",
  window: "#9fc3e0",
  graphite: "#15171c",
  uniform: "#23406b",
  scarf: "#2a9d8f",
};

const MOVE = { transition: "transform 700ms ease-in-out, opacity 700ms ease-in-out" };

// Голова персонажа размером size по высоте с центром в (x, y). Head рисуется от подбородка,
// а видимая голова с причёской и шапкой занимает по высоте 156 его единиц
function HeadAt({ look, emotion, x, y, size }: { look: Look | "conductor"; emotion: Emotion; x: number; y: number; size: number }) {
  const s = size / 156;
  return <Head look={LOOKS[look]} emotion={emotion} x={x} bottom={y + 72 * s} height={110 * s} />;
}

// Вагон сверху: кресла, пассажиры, сумки, находка и проводник в проходе. Касание прохода — идти,
// касание вещи — подойти и осмотреть. Действия меняют вагон: эвакуация отводит соседние ряды,
// лишняя тревога пугает пассажиров, игрушку откатывают с прохода
export function CarView({
  car,
  state,
  y,
  bubble,
  onWalk,
  onItem,
  onBag,
}: {
  car: Car;
  state: InspectionState;
  y: number;
  bubble: { at: Spot; key: number } | null;
  onWalk: (y: number) => void;
  onItem: () => void;
  onBag: (bag: Bag) => void;
}) {
  const evacuated = state.actions.includes("evacuate");
  const cleared = state.actions.includes("clear");
  const emotion: Emotion = state.panic ? "worried" : "calm";

  const walk = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onWalk(TOP + ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT);
  };
  // Вещи ловят касание сами, иначе оно ушло бы в «идти»
  const tap = (handler: () => void) => (event: PointerEvent) => {
    event.stopPropagation();
    handler();
  };

  return (
    <svg
      viewBox={`0 ${TOP} ${WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="Вагон 5 сверху: проводник в проходе, пассажиры в креслах"
      onPointerDown={walk}
      className="block w-full touch-none select-none"
    >
      <rect x={25} y={90} width={430} height={700} rx={10} fill={COLORS.floor} stroke={COLORS.wall} strokeWidth={6} />
      <rect x={185} y={95} width={110} height={690} fill={COLORS.aisle} />
      {Array.from({ length: ROWS }, (_, row) => {
        const rowY = ROW_Y0 + row * ROW_STEP;
        return (
          <g key={row}>
            <rect x={25} y={rowY - 18} width={6} height={36} fill={COLORS.window} />
            <rect x={449} y={rowY - 18} width={6} height={36} fill={COLORS.window} />
            {SEAT_X.map((seatX) => (
              <g key={seatX}>
                <rect x={seatX - 25} y={rowY - 23} width={50} height={46} rx={6} fill={COLORS.seat} />
                <rect x={seatX - 18} y={rowY - 23} width={36} height={8} rx={3} fill={COLORS.headrest} />
              </g>
            ))}
          </g>
        );
      })}
      {/* Тамбур с дверью в конце вагона */}
      <rect x={195} y={767} width={90} height={10} rx={2} fill={COLORS.graphite} />

      {car.passengers.map((passenger, index) => {
        const { seat } = passenger;
        // Пассажиры двух ближайших к находке рядов пересаживаются подальше от неё
        const moved = evacuated && Math.abs(seat.y - car.item.y) <= ROW_STEP * 2;
        const away = seat.y < car.item.y ? -1 : 1;
        return (
          <g key={index} style={{ ...MOVE, transform: moved ? `translateY(${away * ROW_STEP * 2}px)` : undefined, opacity: moved ? 0.45 : 1 }}>
            <ellipse cx={seat.x} cy={seat.y + 10} rx={20} ry={13} fill={passenger.coat} />
            <HeadAt look={passenger.look} emotion={emotion} x={seat.x} y={seat.y - 4} size={36} />
          </g>
        );
      })}

      {car.bags.map((bag, index) => (
        <BagShape key={index} spot={bag.seat} color={bag.color} onTap={tap(() => onBag(bag))} />
      ))}

      <g style={{ ...MOVE, transform: cleared ? `translateX(${CLEAR_SHIFT}px)` : undefined, opacity: cleared ? 0.4 : 1 }}>
        <Item kind={car.kind} spot={car.item} onTap={tap(onItem)} />
      </g>

      <g style={{ transform: `translate(${AISLE_X}px, ${y}px)` }}>
        <ellipse cx={0} cy={12} rx={22} ry={14} fill={COLORS.uniform} />
        <circle cx={0} cy={5} r={5} fill={COLORS.scarf} />
        <HeadAt look="conductor" emotion="calm" x={0} y={-4} size={39} />
      </g>

      {bubble && (
        <g key={bubble.key} className="motion-safe:animate-in motion-safe:fade-in">
          <rect x={bubble.at.x - 56} y={bubble.at.y - 50} width={112} height={26} rx={13} fill="#fff" stroke={COLORS.wall} />
          <text x={bubble.at.x} y={bubble.at.y - 32} textAnchor="middle" fontSize={13} fill={COLORS.graphite}>
            Это моя сумка
          </text>
        </g>
      )}
    </svg>
  );
}

function BagShape({ spot, color, onTap }: { spot: Spot; color: string; onTap: (event: PointerEvent) => void }) {
  return (
    <g onPointerDown={onTap} className="cursor-pointer">
      <rect x={spot.x - 7} y={spot.y - 14.5} width={14} height={5} fill={color} stroke="rgb(0 0 0 / .25)" />
      <rect x={spot.x - 16} y={spot.y - 10} width={32} height={24} rx={3} fill={color} stroke="rgb(0 0 0 / .2)" strokeWidth={2} />
    </g>
  );
}

// Внешний вид находки подсказывает, что это: у коробки идёт дым, рюкзак со светоотражателем, мишка в проходе
function Item({ kind, spot, onTap }: { kind: Car["kind"]; spot: Spot; onTap: (event: PointerEvent) => void }) {
  const { x, y } = spot;
  if (kind === "bag") return <BagShape spot={spot} color="#6b4a34" onTap={onTap} />;
  if (kind === "backpack") {
    return (
      <g onPointerDown={onTap} className="cursor-pointer">
        <rect x={x - 14} y={y - 13} width={28} height={30} rx={5} fill="#2f6b4f" stroke="rgb(0 0 0 / .2)" strokeWidth={2} />
        <rect x={x - 9} y={y + 3} width={18} height={10} rx={2} fill="#285c43" />
        <rect x={x - 9} y={y - 7.5} width={18} height={3} fill="#ffb020" />
      </g>
    );
  }
  if (kind === "smoke") {
    return (
      <g onPointerDown={onTap} className="cursor-pointer">
        <rect x={x - 15} y={y - 11} width={30} height={26} fill="#c9a877" stroke="rgb(138 106 60 / .6)" strokeWidth={2} />
        <rect x={x - 15} y={y} width={30} height={4} fill="#a88a5a" />
        <path d={`M${x + 8} ${y + 10} L${x + 20} ${y + 18}`} stroke="#d63b3b" strokeWidth={2} />
        {/* Струйка дыма: серые клубы поднимаются и тают — видно издалека */}
        {[0, 0.53, 1.06].map((begin) => (
          <circle key={begin} cx={x} cy={y - 8} r={5} fill="#8a919c" opacity={0}>
            <animate attributeName="cy" values={`${y - 8};${y - 48}`} dur="1.6s" begin={`${begin}s`} repeatCount="indefinite" />
            <animate attributeName="r" values="5;10" dur="1.6s" begin={`${begin}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0" dur="1.6s" begin={`${begin}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
    );
  }
  return (
    <g onPointerDown={onTap} className="cursor-pointer">
      <circle cx={x} cy={y + 4} r={10} fill="#c9892f" />
      <circle cx={x} cy={y - 8} r={7} fill="#c9892f" />
      <circle cx={x - 6} cy={y - 13} r={3} fill="#a86d20" />
      <circle cx={x + 6} cy={y - 13} r={3} fill="#a86d20" />
    </g>
  );
}
