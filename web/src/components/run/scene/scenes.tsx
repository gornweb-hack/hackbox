import type { ReactNode, SVGProps } from "react";
import type { Outcome } from "@/lib/runs";
import type { Tone } from "@/lib/scales";
import { type Arm, Burst, Conductor, type Face, type Holding, Interior, Seat, Seated, Standing, Trolley } from "./figures";

// Фаза сцены: идёт прохождение или показан исход
export type Phase = "play" | Outcome;

// Поза проводника для действия из ответа. approach — насколько он подходит к пассажиру:
// near — вплотную, half — на полпути, stay — остаётся у тележки
interface Pose {
  right: Arm;
  left?: Arm;
  holding?: Holding;
  approach: "near" | "half" | "stay";
  face?: Face;
  flip?: boolean;
  burst?: boolean;
}

// Действия проводника — значения поля action у варианта ответа в YAML. Ответ без action
// показывается по оценке решения: хорошее — проводник подходит и протягивает руку
const POSES = {
  reach: { right: "reach", approach: "near" },
  radio: { right: "phone", holding: "radio", approach: "half" },
  announce: { right: "phone", holding: "mic", approach: "stay" },
  water: { right: "reach", holding: "water", approach: "near" },
  pill: { right: "reach", holding: "pill", approach: "near" },
  ticket: { right: "reach", holding: "ticket", approach: "near" },
  point: { right: "reach", approach: "stay" },
  calm: { right: "calm", left: "calm", approach: "near" },
  ignore: { right: "push", approach: "stay", flip: true },
  shout: { right: "up", approach: "near", face: "angry", burst: true },
} satisfies Record<string, Pose>;

export type SceneAction = keyof typeof POSES;

// Неизвестное действие (опечатка в YAML) не ломает сцену — показывается реакция по оценке
export function sceneAction(value?: string): SceneAction | undefined {
  return value !== undefined && value in POSES ? (value as SceneAction) : undefined;
}

const HELP: Pose = { right: "reach", approach: "near" };
const IDLE: Pose = { right: "push", approach: "stay" };

function poseFor(action: SceneAction | undefined, help: boolean): Pose {
  return action ? POSES[action] : help ? HELP : IDLE;
}

function approachDx(pose: Pose, nearDx: number) {
  return pose.approach === "near" ? nearDx : pose.approach === "half" ? nearDx / 2 : 0;
}

export interface SceneProps {
  phase: Phase;
  // Как ощущается последнее решение: хорошее — проводник помогает, плохое — пассажиру хуже
  reaction?: Tone;
  // Что сделал проводник в последнем ответе — только во время прохождения
  action?: SceneAction;
  clip: string;
  // Класс покачивания на ходу, пока проводник идёт
  bob?: string;
  // Свойства группы, которая везёт проводника с тележкой по проходу, пока человек читает
  walk: SVGProps<SVGGElement>;
}

// Сдвиг фигуры с плавным переходом: проводник подходит к пассажиру, спорщик уходит
function Move({ dx, children, slow }: { dx: number; children: ReactNode; slow?: boolean }) {
  return (
    <g className={slow ? "transition-transform duration-[1400ms] ease-in-out" : "transition-transform duration-700 ease-in-out"} style={{ transform: `translateX(${dx}px)` }}>
      {children}
    </g>
  );
}

// Проводник с тележкой. Поза — по действию из ответа, а без него по help: подойти и протянуть руку.
// nearDx — насколько он отходит от тележки, чтобы оказаться рядом с пассажиром
function ConductorWithTrolley({
  walk,
  bob,
  action,
  help,
  nearDx,
}: Pick<SceneProps, "walk" | "bob" | "action"> & { help: boolean; nearDx: number }) {
  const pose = poseFor(action, help);
  const dx = approachDx(pose, nearDx);
  return (
    <g {...walk}>
      <Trolley x={142} bob={bob} />
      <Move dx={dx}>
        <g className={bob}>
          <Conductor x={130} right={pose.right} left={pose.left} holding={pose.holding} face={pose.face} flip={pose.flip} />
        </g>
        {pose.burst && <Burst cx={130} cy={103} tone="anger" />}
      </Move>
    </g>
  );
}

const good = (p: SceneProps) => p.phase === "good" || (p.phase === "play" && p.reaction === "good");
const bad = (p: SceneProps) => p.phase === "bad" || (p.phase === "play" && p.reaction === "bad");

// «Пассажиру плохо»: пожилой пассажир держится за грудь, соседка зовёт проводника.
// Помощь — проводник рядом и протягивает руку; промедление — пассажир сползает в кресле
function SickScene(p: SceneProps) {
  const helped = good(p) || p.phase === "ok";
  const face = p.phase === "good" ? "smile" : p.phase === "ok" ? "sad" : bad(p) ? "out" : "pale";
  return (
    <g>
      <Interior clip={p.clip} />
      <Seat x={200} />
      <Seat x={278} />
      <Seated x={240} coat="#7a7f87" hair="#cfcfcf" face={face} arm={p.phase === "play" ? "chest" : "lap"} slump={bad(p)} />
      <Seated x={318} coat="#c0674a" skin="#e8b892" face={p.phase === "good" ? "smile" : "sad"} arm={p.phase === "play" && !p.reaction ? "wave" : "lap"} />
      {bad(p) && <Burst cx={318} cy={129} tone="worry" />}
      <ConductorWithTrolley walk={p.walk} bob={p.bob} action={p.action} help={helped} nearDx={54} />
    </g>
  );
}

// «Два пассажира на одно место»: двое спорят у кресла. Спокойный разговор — спор стихает,
// в хорошем исходе один садится, второй уходит в Бизнес-класс; в плохом приходит сотрудник ПТБ
function SeatScene(p: SceneProps) {
  const arguing = p.phase === "bad" || (p.phase === "play" && p.reaction !== "good");
  const face = arguing ? "angry" : p.phase === "ok" ? "sad" : "calm";
  const seated = p.phase === "good" || p.phase === "ok";
  return (
    <g>
      <Interior clip={p.clip} />
      <Seat x={200} />
      <Seat x={278} />
      <Seated x={318} coat="#5e8f6a" skin="#e8b892" face={bad(p) ? "sad" : "calm"} />
      {seated ? (
        <Seated x={240} coat="#8a6fb0" hair="#3a2e26" face={p.phase === "good" ? "smile" : "sad"} />
      ) : (
        <Standing x={228} coat="#8a6fb0" hair="#3a2e26" face={face} right={arguing ? "up" : "down"} />
      )}
      <Move dx={p.phase === "good" ? 170 : 0} slow>
        <Standing x={262} coat="#c9892f" skin="#e8b892" hair="#2f2a26" face={p.phase === "good" ? "smile" : face} right={arguing ? "up" : "down"} flip />
      </Move>
      {arguing && (
        <>
          <Burst cx={228} cy={103} tone="anger" />
          <Burst cx={262} cy={103} tone="anger" />
        </>
      )}
      {p.phase === "bad" && <Standing x={96} coat="#1d2a44" pants="#141c2b" hat="cap" hair="#3a2e26" />}
      <ConductorWithTrolley walk={p.walk} bob={p.bob} action={p.action} help={good(p)} nearDx={44} />
    </g>
  );
}

// «Минутная стоянка»: поезд стоит, двери открыты, пассажирке душно, и она тянется к выходу.
// После финала поезд едет: пассажирка на месте — или её кресло пустое, а вещи остались
function StopScene(p: SceneProps) {
  const standing = p.phase === "play";
  return (
    <g>
      <Interior clip={p.clip} station={p.phase === "play"} />
      <g>
        <rect x="362" y="80" width="38" height="120" fill="#c9d2dc" />
        {standing ? (
          <g>
            <rect x="366" y="84" width="34" height="116" fill="#aab3bd" />
            <rect x="366" y="150" width="34" height="3" fill="#e3c14a" />
          </g>
        ) : (
          <rect x="370" y="96" width="22" height="30" rx="4" fill="#d7e7f3" />
        )}
      </g>
      <Seat x={200} />
      <Seat x={278} />
      <Seated x={240} coat="#7a7f87" hair="#cfcfcf" face={bad(p) ? "sad" : "calm"} />
      {p.phase === "good" || p.phase === "ok" ? <Seated x={318} coat="#b0506e" skin="#f1cfb0" hair="#8a5a3c" face={p.phase === "good" ? "smile" : "sad"} /> : null}
      {p.phase === "bad" && <rect x="304" y="164" width="26" height="18" rx="3" fill="#8a5a3c" />}
      {standing && (
        <Move dx={p.reaction === "bad" ? 14 : 0}>
          <Standing x={344} coat="#b0506e" skin="#f1cfb0" hair="#8a5a3c" face={p.reaction === "good" ? "calm" : "sad"} left={p.reaction ? "down" : "wave"} />
        </Move>
      )}
      <ConductorWithTrolley walk={p.walk} bob={p.bob} action={p.action} help={good(p)} nearDx={p.phase === "play" ? 170 : 150} />
    </g>
  );
}

// «Посадка без билета»: платформа, открытая дверь вагона, пассажир с чемоданом спорит с проводником.
// Хороший исход — пассажир с улыбкой идёт в кассу, плохой — скандал у вагона и недовольная очередь
function PlatformScene(p: SceneProps) {
  const walkAway = p.phase === "good" || p.phase === "ok";
  const angry = bad(p) || (p.phase === "play" && !p.reaction);
  return (
    <g>
      <rect y="74" width="400" height="144" fill="#dfe8f1" />
      <rect y="84" width="400" height="106" fill="#eef2f6" />
      <rect y="150" width="400" height="7" fill="#23406b" />
      {[20, 100, 320].map((x) => (
        <rect key={x} x={x} y="100" width="62" height="30" rx="6" fill="#a9bccd" />
      ))}
      <rect x="236" y="96" width="46" height="94" rx="4" fill="#2b3440" />
      <rect x="232" y="188" width="54" height="6" fill="#7c8894" />
      <rect y="194" width="400" height="24" fill="#aab3bd" />
      <rect y="194" width="400" height="3" fill="#e3c14a" />
      <rect x="40" y="74" width="10" height="120" fill="#7c8894" />
      <rect x="14" y="104" width="62" height="18" rx="3" fill="#1f5bff" />
      <text x="45" y="117" textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff" fontFamily="sans-serif">
        Кассы
      </text>
      <Standing x={150} coat="#5e8f6a" skin="#e8b892" suitcase face={bad(p) ? "angry" : "calm"} />
      <Standing x={180} coat="#8a6fb0" hair="#3a2e26" suitcase face={bad(p) ? "sad" : "calm"} />
      {bad(p) && <Burst cx={165} cy={103} tone="anger" />}
      <Move dx={p.phase === "good" ? -150 : p.phase === "ok" ? -110 : 0} slow>
        <Standing
          x={214}
          coat="#c9892f"
          skin="#f0c8a4"
          suitcase
          face={p.phase === "good" ? "smile" : p.phase === "ok" ? "sad" : angry ? "angry" : "calm"}
          right={angry ? "up" : "down"}
          flip={walkAway}
        />
      </Move>
      {angry && !walkAway && <Burst cx={214} cy={103} tone="anger" />}
      <PlatformConductor action={p.action} help={good(p)} sad={p.phase === "bad"} />
    </g>
  );
}

// Проводник у двери вагона смотрит на пассажира; подходя, он идёт влево
function PlatformConductor({ action, help, sad }: { action?: SceneAction; help: boolean; sad: boolean }) {
  const pose: Pose = action ? POSES[action] : help ? HELP : { ...IDLE, right: "down" };
  return (
    <Move dx={-approachDx(pose, 40)}>
      <Conductor x={300} right={pose.right} left={pose.left} holding={pose.holding} face={sad ? "sad" : pose.face} flip={!pose.flip} />
      {pose.burst && <Burst cx={300} cy={103} tone="anger" />}
    </Move>
  );
}

// Общая сцена для сценариев без своей: салон, два пассажира, проводник с тележкой
function GeneralScene(p: SceneProps) {
  return (
    <g>
      <Interior clip={p.clip} />
      <Seat x={200} />
      <Seat x={278} />
      <Seated x={240} coat="#7a7f87" hair="#cfcfcf" face={p.phase === "good" ? "smile" : bad(p) ? "sad" : "calm"} />
      <Seated x={318} coat="#c0674a" skin="#e8b892" face={p.phase === "good" ? "smile" : "calm"} />
      <ConductorWithTrolley walk={p.walk} bob={p.bob} action={p.action} help={good(p)} nearDx={54} />
    </g>
  );
}

// Сцена по id сценария — это имя файла в content/scenarios. Новый сценарий без своей сцены
// показывается в общем салоне, поэтому YAML можно добавлять, не трогая фронт
export function Scene({ scenarioId, ...props }: SceneProps & { scenarioId?: string }) {
  switch (scenarioId) {
    case "sick-passenger":
      return <SickScene {...props} />;
    case "double-booking":
      return <SeatScene {...props} />;
    case "minute-stop":
      return <StopScene {...props} />;
    case "boarding-no-ticket":
      return <PlatformScene {...props} />;
    default:
      return <GeneralScene {...props} />;
  }
}
