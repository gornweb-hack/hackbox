import type { Emotion } from "../scene/head";
import { LOOKS } from "../scene/head";
import type { Tone } from "@/lib/scales";

// Кто стоит на сцене новеллы в каждом узле сценария и как он реагирует на прошлое решение.
// Текст узлов и логика — из движка (content/scenarios), здесь только постановка. Сценарий без
// постановки играется в обычном плеере, поэтому YAML можно добавлять, не трогая фронт

export interface Role {
  look: keyof typeof LOOKS;
  name: string;
  role: string;
  coat: string;
  // Цвет плашки с именем
  plate: string;
  // Эмоция без реакции, после хорошего и после плохого решения
  calm: Emotion;
  good: Emotion;
  bad: Emotion;
  // Лицо бледнеет, когда эмоция — «плохо»
  paleWhenPain?: boolean;
}

export interface Stage {
  left?: Role;
  right?: Role;
  // Кто в центре внимания: он ярче, его имя на плашке реплики
  focus: "left" | "right";
  // Поезд стоит у платформы: за окном перрон вместо летящего пейзажа
  station?: boolean;
}

const SEROV: Role = { look: "elder", name: "Серов", role: "пассажир 12А", coat: "#6d727a", plate: "#6d727a", calm: "pain", good: "worried", bad: "pain", paleWhenPain: true };
const ALOVA: Role = { look: "neighbour", name: "Алова", role: "пассажирка 12Б", coat: "#a8462f", plate: "#e0524f", calm: "worried", good: "calm", bad: "angry" };
const SINITSYN: Role = { look: "chief", name: "Синицын", role: "начальник поезда", coat: "#18253d", plate: "#3f6fb5", calm: "calm", good: "smile", bad: "worried" };
const BELOVA: Role = { look: "doctor", name: "Белова", role: "врач, пассажирка", coat: "#f4f5f7", plate: "#2a9d8f", calm: "calm", good: "smile", bad: "angry" };

// Ключ — id сценария (имя файла), внутри — id узлов из YAML
const CASTS: Record<string, Record<string, Stage>> = {
  "sick-passenger": {
    alarm: { left: SEROV, right: ALOVA, focus: "right" },
    worse: { left: SEROV, right: ALOVA, focus: "left" },
    medics: { left: SEROV, right: SINITSYN, focus: "right" },
    doctor: { left: { ...SEROV, calm: "worried" }, right: BELOVA, focus: "right" },
    station: { left: SEROV, right: SINITSYN, focus: "left", station: true },
  },
};

export function stageFor(scenarioId: string, nodeId: string): Stage | undefined {
  return CASTS[scenarioId]?.[nodeId];
}

export function hasNovel(scenarioId: string) {
  return scenarioId in CASTS;
}

export function emotionOf(role: Role, reaction?: Tone): Emotion {
  return reaction === "good" ? role.good : reaction === "bad" ? role.bad : role.calm;
}
