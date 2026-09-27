// Правила мини-игры «Бесхозная вещь». Каждый раз находка разная, и правильный ответ зависит от неё:
// сумка без владельца (памятка «Ситуации на борту», №41), рюкзак, владелец которого вышел
// (№17, №41), коробка с запахом гари (№20, №41), детская игрушка в проходе (№14).
// Общее правило для всех: чужую вещь не открывают и не уносят

export type ActionId = "announce" | "radio" | "ask" | "evacuate" | "clear" | "callOwner" | "carry" | "open";

export const ACTION_TEXT: Record<ActionId, string> = {
  announce: "Объявить: «Уважаемые пассажиры, просьба не приближаться к предмету»",
  radio: "Сообщить начальнику поезда и сотрудникам ПТБ по рации",
  ask: "Спросить пассажиров рядом, чья это вещь",
  evacuate: "Попросить пассажиров ближайших рядов пересесть подальше",
  clear: "Убрать вещь с прохода, чтобы никто не споткнулся",
  callOwner: "Объявить: «Пассажира с места 7Б просим вернуться к своему месту»",
  carry: "Взять вещь и отнести в служебное купе",
  open: "Открыть и посмотреть, что внутри",
};

export type ItemKind = "bag" | "backpack" | "smoke" | "toy";

export interface ItemRule {
  kind: ItemKind;
  // Как находку называет подсказка после того, как её нашли
  title: string;
  // Номера ситуаций памятки — для разбора
  memo: string;
  // Что говорит сосед, когда проводник подошёл: подсказка к правильному ответу
  clue: { speaker: "neighbour" | "elder"; text: string } | null;
  // Варианты действий на экране; порядок на экране перемешивается
  offered: ActionId[];
  // После всех обязательных шагов осмотр закончен
  required: ActionId[];
  // Нарушение: игра сразу заканчивается плохим исходом
  forbidden: ActionId[];
  // Разрешено, но это перебор или потеря времени — исход «с замечанием»
  excess: Partial<Record<ActionId, string>>;
  // [a, b, пояснение]: если выбраны оба, a должно быть раньше b
  order: [ActionId, ActionId, string][];
  // Как правильно по памятке — в разбор при любом исходе
  lesson: string;
  // Сюжетная концовка по исходу
  endings: Record<Outcome, string>;
  // Может ли пассажир попытаться сам унести вещь (событие «сам вынесу»)
  grabbable: boolean;
}

export type Outcome = "good" | "ok" | "bad";

export const ITEMS: Record<ItemKind, ItemRule> = {
  bag: {
    kind: "bag",
    title: "Сумка без владельца",
    memo: "№41",
    clue: null,
    offered: ["announce", "radio", "ask", "carry", "open"],
    required: ["announce", "radio"],
    forbidden: ["carry", "open"],
    excess: {},
    order: [["radio", "ask", "Сначала сообщите начальнику поезда и ПТБ по рации, а уже потом выясняйте, чья вещь."]],
    lesson: "Памятка №41: вещь не трогать, попросить пассажиров не приближаться и сообщить начальнику поезда и ПТБ по радиосвязи. Фраза: «Благодарю за бдительность, сейчас я уточню, кому принадлежит оставленная вещь».",
    endings: {
      good: "Сотрудник ПТБ забрал сумку: в ней оказался забытый ноутбук. Владельца встретили на станции.",
      ok: "Сумку проверили, всё обошлось, но ПТБ узнали о ней позже, чем могли бы.",
      bad: "Сумку трогали до прихода ПТБ. Начальник поезда разбирает инцидент.",
    },
    grabbable: true,
  },
  backpack: {
    kind: "backpack",
    title: "Рюкзак на месте 7Б",
    memo: "№17, №41",
    clue: { speaker: "neighbour", text: "Это рюкзак мужчины с места 7Б. Он пять минут назад ушёл в вагон-бистро." },
    offered: ["ask", "callOwner", "radio", "announce", "carry"],
    required: ["ask", "callOwner"],
    forbidden: ["carry"],
    excess: {
      radio: "Владелец известен — поднимать ПТБ по рации не нужно: это лишняя тревога для всего поезда.",
      announce: "Просить не приближаться к рюкзаку, владелец которого вышел на пять минут, — лишняя тревога в вагоне.",
    },
    order: [["ask", "callOwner", "Сначала уточните у соседей, чья вещь, потом объявляйте — иначе объявление будет наугад."]],
    lesson: "Если владелец известен и вышел ненадолго, вещь не опасна: уточните у соседей и пригласите владельца вернуться. Вещь при этом не трогают.",
    endings: {
      good: "Владелец вернулся из бистро и поблагодарил, что присмотрели за рюкзаком. В вагоне спокойно.",
      ok: "Владелец вернулся, но пассажиры успели разволноваться из-за лишней тревоги.",
      bad: "Рюкзак унесли в служебное купе — вернувшийся владелец решил, что его обокрали, и пишет жалобу.",
    },
    grabbable: false,
  },
  smoke: {
    kind: "smoke",
    title: "Коробка с запахом гари",
    memo: "№20, №41",
    clue: { speaker: "elder", text: "Чувствуете? От этой коробки пахнет горелым!" },
    offered: ["radio", "evacuate", "ask", "open", "carry"],
    required: ["radio", "evacuate"],
    forbidden: ["open", "carry"],
    excess: { ask: "При запахе гари каждая секунда важна — выяснять, чья коробка, некогда." },
    order: [],
    lesson: "Памятки №20 и №41: не допускать задымления и возгорания, сразу сообщить начальнику поезда и ПТБ по рации, отвести людей от предмета и не трогать его.",
    endings: {
      good: "Пассажиров отвели, ПТБ обесточили коробку: перегрелся забытый пауэрбанк. Никто не пострадал.",
      ok: "Коробку обезвредили, но на выяснения ушло время, пока дым шёл в салон.",
      bad: "Коробку вскрыли — повалил дым, сработала пожарная сигнализация, поезд остановили.",
    },
    grabbable: true,
  },
  toy: {
    kind: "toy",
    title: "Игрушка в проходе",
    memo: "№14",
    clue: null,
    offered: ["clear", "ask", "radio", "announce"],
    required: ["clear", "ask"],
    forbidden: [],
    excess: {
      radio: "Игрушка не опасна — вызывать ПТБ по рации значит поднять лишнюю тревогу.",
      announce: "Просить не приближаться к детской игрушке — лишняя тревога в вагоне.",
    },
    order: [],
    lesson: "Памятка №14: проход должен оставаться свободным — вещь убрать с прохода и найти владельца.",
    endings: {
      good: "Игрушку вернули малышу из 5А, проход свободен. Мама благодарит.",
      ok: "Игрушку вернули, но пассажиры успели решить, что в вагоне что-то опасное.",
      bad: "Игрушка так и осталась в проходе.",
    },
    grabbable: false,
  },
};

// Случайное событие во время осмотра: просьба о чае или пассажир, который хочет сам унести вещь
export type EventChoice = { id: "tea"; choice: "polite" | "serve" | "ignore" } | { id: "grab"; choice: "stop" | "allow" };

// Сколько секунд осмотра забирает поход за чаем
export const TEA_SECONDS = 10;
const WRONG_TAP_LOYALTY = 5;

export interface Play {
  kind: ItemKind;
  found: boolean;
  actions: ActionId[];
  // Сколько раз побеспокоили пассажиров, у которых вещь своя
  wrongTaps: number;
  event?: EventChoice;
}

export interface Result {
  kind: ItemKind;
  outcome: Outcome;
  loyaltyDelta: number;
  safetyDelta: number;
  ending: string;
  // Разбор: что пошло не так и как правильно по памятке
  notes: string[];
}

export function isFinished(kind: ItemKind, actions: ActionId[]): boolean {
  const rule = ITEMS[kind];
  return actions.some((id) => rule.forbidden.includes(id)) || rule.required.every((id) => actions.includes(id));
}

export function judge(play: Play): Result {
  const rule = ITEMS[play.kind];
  const bother = play.wrongTaps * WRONG_TAP_LOYALTY;
  const result = (outcome: Outcome, loyaltyDelta: number, safetyDelta: number, notes: string[]): Result => ({
    kind: play.kind,
    outcome,
    loyaltyDelta: loyaltyDelta - bother,
    safetyDelta,
    ending: rule.endings[outcome],
    notes: [...notes, rule.lesson],
  });

  if (!play.found) {
    return result("bad", 0, -30, ["Находку не заметили вовремя. Осматривайте салон по порядку и не отвлекайтесь на вещи, рядом с которыми сидят владельцы."]);
  }
  const touched = play.actions.find((id) => rule.forbidden.includes(id));
  if (touched || (play.event?.id === "grab" && play.event.choice === "allow")) {
    return result("bad", -10, -40, [
      touched ? "Чужую вещь нельзя уносить и открывать: неизвестно, что внутри." : "Пассажиру нельзя разрешать уносить чужую вещь — остановите его вежливо и твёрдо.",
    ]);
  }

  const issues: string[] = [];
  for (const id of play.actions) {
    const note = rule.excess[id];
    if (note) issues.push(note);
  }
  for (const [first, second, note] of rule.order) {
    const a = play.actions.indexOf(first);
    const b = play.actions.indexOf(second);
    if (a !== -1 && b !== -1 && b < a) issues.push(note);
  }
  if (play.event?.id === "tea" && play.event.choice === "ignore") {
    issues.push("Пассажира нельзя оставлять без ответа: скажите, что подойдёте, как только закончите осмотр.");
  }

  const praise: string[] = [];
  if (play.event?.id === "tea" && play.event.choice === "serve") praise.push("Осмотр важнее сервиса: чай подождёт, пока салон не проверен.");
  if (play.event?.id === "grab") praise.push("Вы остановили пассажира, который хотел унести чужую вещь, — так и нужно.");
  if (play.wrongTaps > 0) praise.push(`Вы ${play.wrongTaps} раз побеспокоили пассажиров с их собственными вещами — смотрите, сидит ли рядом владелец.`);

  return issues.length === 0 ? result("good", 10, 25, praise) : result("ok", -5 * issues.length, 10, [...issues, ...praise]);
}
