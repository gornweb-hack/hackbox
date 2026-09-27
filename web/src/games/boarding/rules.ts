// Правила мини-игры «Посадка». Биометрия у двери вагона не сработала, и проводник проверяет пассажиров
// вручную: билет, документ, что при себе, как себя ведёт. Каждая строка CASES — ситуация памятки
// «Ситуации на борту»: какое действие верное, какое слабое (вежливо, но не по стандарту) и что сказать.
// Поменять правило — поменять строку. Чистые функции без React: их проверяет rules.test.ts

export type Round = 1 | 2 | 3;
export type Action = "board" | "refuse" | "passport" | "carrier" | "fold" | "chief";
export type Kind = "ok" | "invalidTicket" | "noDocument" | "deadPhone" | "pet" | "bike" | "parcel" | "drunk";
export type Verdict = "correct" | "weak" | "wrong";

// Кнопки открываются по рейсам вместе с правилами, для которых они нужны
export const ACTIONS: Record<Action, { label: string; round: Round }> = {
  board: { label: "Посадка", round: 1 },
  refuse: { label: "Отказать", round: 1 },
  passport: { label: "Проверить по паспорту", round: 2 },
  carrier: { label: "Предложить переноску", round: 2 },
  fold: { label: "Попросить сложить велосипед", round: 3 },
  chief: { label: "Позвать начальника поезда", round: 3 },
};

export interface CaseRule {
  // Номер ситуации в памятке; у «всё в порядке» его нет
  memo: number | null;
  round: Round;
  title: string;
  // Правило рейса: показывается перед рейсом и в разборе
  rule: string;
  correct: Action;
  weak: Action[];
  // Фраза из памятки
  phrase: string | null;
}

export const CASES: Record<Kind, CaseRule> = {
  ok: {
    memo: null,
    round: 1,
    title: "Всё в порядке",
    rule: "Дата, время и ФИО в билете и документе совпадают — посадка. Питомец в переноске и сложенный велосипед — тоже в порядке.",
    correct: "board",
    weak: [],
    phrase: null,
  },
  invalidTicket: {
    memo: 1,
    round: 1,
    title: "Билет на другую дату или время",
    rule: "Сверьте число и время отправления. Билет не на этот поезд — посадка не осуществляется, подскажите, куда обратиться.",
    correct: "refuse",
    weak: [],
    phrase: "«Сожалею, но без действительного проездного документа посадка не осуществляется, я подскажу, куда можно обратиться для оформления»",
  },
  noDocument: {
    memo: 2,
    round: 2,
    title: "Нет документа или он на другое имя",
    rule: "Нужен документ, по которому оформлен билет. Без подтверждения личности посадка невозможна.",
    correct: "refuse",
    // Памятка: начальника поезда приглашают «при необходимости» — само по себе это не решение
    weak: ["chief"],
    phrase: "«К сожалению, без подтверждения личности я не могу допустить Вас к посадке»",
  },
  deadPhone: {
    memo: 32,
    round: 2,
    title: "Сел телефон с билетом",
    rule: "Билет не показать — проверьте данные по паспорту. Пускать на борт, чтобы зарядить телефон, нельзя.",
    correct: "passport",
    weak: [],
    phrase: "«Позвольте, я проверю данные по документу, на который Вы оформляли билет»",
  },
  pet: {
    memo: 4,
    round: 2,
    title: "Питомец без переноски",
    rule: "Питомцев провозят только в переноске — предложите купить её на борту. При отказе — начальник поезда.",
    correct: "carrier",
    weak: ["refuse", "chief"],
    phrase: "«Обращаю Ваше внимание, что провоз питомцев осуществляется только в переноске. Вы можете приобрести переноску на борту»",
  },
  bike: {
    memo: 5,
    round: 3,
    title: "Велосипед не сложен",
    rule: "Велосипед везут сложенным или упакованным, чтобы не мешал проходу. Попросите сложить и подскажите место.",
    correct: "fold",
    weak: ["refuse", "chief"],
    phrase: "«Если Вы сможете его сложить или упаковать сейчас, я подскажу безопасное место размещения»",
  },
  parcel: {
    memo: 39,
    round: 3,
    title: "Просьба передать посылку",
    rule: "Посылки к передаче не принимают — любые, даже «совсем маленькие». Подскажите сервис отправлений на вокзале.",
    correct: "refuse",
    weak: [],
    phrase: "«Сожалею, но мы не принимаем к передаче личные вещи пассажиров. Вы можете воспользоваться сервисом отправлений на вокзале»",
  },
  drunk: {
    memo: 6,
    round: 3,
    title: "Признаки опьянения",
    rule: "Обязательно сообщите начальнику поезда. По рации не называйте пассажира пьяным — это провоцирует агрессию.",
    correct: "chief",
    // Решение о посадке принимает начальник поезда, а не проводник в одиночку
    weak: ["refuse"],
    phrase: "«Прошу Вас соблюдать спокойствие и не создавать неудобств другим пассажирам»",
  },
};

// Финал третьего рейса: двери закрылись, к ним бежит опоздавший (памятка, №3)
export const LATE = {
  memo: 3,
  round: 3 as Round,
  title: "Опоздавший пассажир",
  rule: "Двери закрыты — поезд не задерживают и двери не открывают. Направьте в кассу или к информационной стойке.",
  phrase: "«Понимаю Ваше волнение. Поезд уже отправился по расписанию, пожалуйста, обратитесь в кассу или информационную стойку»",
};

export const ROUNDS: Record<Round, { passengers: number; seconds: number }> = {
  1: { passengers: 6, seconds: 75 },
  2: { passengers: 8, seconds: 90 },
  3: { passengers: 10, seconds: 100 },
};

// Очки и шкалы. Верно пропустил — пассажир доволен (лояльность), верно остановил нарушение — безопасность.
// Ошибка «пустил того, кого нельзя» бьёт по безопасности, лишний отказ или лишнее действие — по лояльности
export const SCORING = {
  correctOk: { points: 10, safety: 0, loyalty: 3 },
  correctCase: { points: 10, safety: 5, loyalty: 0 },
  weak: { points: 3, safety: 0, loyalty: -5 },
  wrongBoard: { points: -10, safety: -15, loyalty: 0 },
  wrongOther: { points: -5, safety: 0, loyalty: -10 },
  // Не успели посадить до отправления — за каждого оставшегося в очереди
  missed: { points: 0, safety: 0, loyalty: -10 },
  lateOpened: { points: -10, safety: -20, loyalty: 0 },
  lateKept: { points: 10, safety: 0, loyalty: 0 },
};

// Поезд, на который идёт посадка. Дату подставляет сцена: в билете хранится сдвиг от сегодняшнего дня
export const TRAIN = { time: "14:40", car: 5 };
const OTHER_TIMES = ["12:40", "16:40", "18:40"];

// Внешность — ключи LOOKS из персонажей сценариев (components/run/scene/head.tsx)
export const PASSENGER_LOOKS = ["man", "woman", "redhead", "elder", "neighbour"] as const;
export type PassengerLook = (typeof PASSENGER_LOOKS)[number];
const FEMALE: PassengerLook[] = ["woman", "neighbour"];
// Синтетические ФИО: распространённые фамилии и случайные инициалы
const SURNAMES = ["Смирнов", "Волков", "Орлов", "Зайцев", "Соколов", "Лебедев", "Морозов", "Никитин", "Белов", "Козлов"];
const INITIALS = "АБВГДЕИКЛМНОПРС";

export type Carry = "pet" | "petInCarrier" | "bike" | "bikeFolded" | "parcel";

export interface Ticket {
  // 0 — сегодня, −1 — вчера, 1 — завтра
  day: number;
  time: string;
  car: number;
  seat: string;
  name: string;
}

export interface Passenger {
  kind: Kind;
  look: PassengerLook;
  // null — показать нечего: сел телефон или это провожающий
  ticket: Ticket | null;
  // ФИО в документе; null — документа нет
  document: string | null;
  carry: Carry | null;
  drunk: boolean;
  line: string;
  // Что не так — подсвечивается в разборе
  flaw: "date" | "time" | "document" | null;
}

export interface Decision {
  passenger: Passenger;
  action: Action;
  verdict: Verdict;
  points: number;
  safety: number;
  loyalty: number;
}

export interface Result {
  points: number;
  safety: number;
  loyalty: number;
  correct: number;
  total: number;
  stars: 0 | 1 | 2 | 3;
  mistakes: Decision[];
  missed: number;
  // null — до финала с опоздавшим не дошли
  lateOpened: boolean | null;
}

type Rng = () => number;

const pick = <T>(items: readonly T[], rng: Rng) => items[Math.floor(rng() * items.length)];

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function personName(look: PassengerLook, rng: Rng) {
  const surname = pick(SURNAMES, rng) + (FEMALE.includes(look) ? "а" : "");
  return `${surname} ${pick([...INITIALS], rng)}. ${pick([...INITIALS], rng)}.`;
}

const OK_LINES = ["Добрый день! Вот билет и паспорт.", "Здравствуйте, я в пятый вагон.", "Успел! Вот, пожалуйста.", "Добрый день, проверяйте."];

// Пассажир для ситуации kind. Обманки (питомец в переноске, сложенный велосипед) бывают только у «всё
// в порядке» и только с того рейса, где открылось их правило
export function makePassenger(kind: Kind, round: Round, rng: Rng = Math.random): Passenger {
  const look = pick(PASSENGER_LOOKS, rng);
  const name = personName(look, rng);
  const ticket: Ticket = { day: 0, time: TRAIN.time, car: TRAIN.car, seat: `${1 + Math.floor(rng() * 16)}${pick(["А", "Б", "В", "Г"], rng)}`, name };
  const base: Passenger = { kind, look, ticket, document: name, carry: null, drunk: false, line: pick(OK_LINES, rng), flaw: null };

  switch (kind) {
    case "ok": {
      const decoys: Carry[] = [...(round >= CASES.pet.round ? ["petInCarrier" as const] : []), ...(round >= CASES.bike.round ? ["bikeFolded" as const] : [])];
      return decoys.length > 0 && rng() < 0.4 ? { ...base, carry: pick(decoys, rng) } : base;
    }
    case "invalidTicket":
      return rng() < 0.5
        ? { ...base, ticket: { ...ticket, day: pick([-1, 1], rng) }, flaw: "date" }
        : { ...base, ticket: { ...ticket, time: pick(OTHER_TIMES, rng) }, flaw: "time" };
    case "noDocument":
      return rng() < 0.5
        ? { ...base, document: null, line: "Паспорт дома забыл… Но билет-то у меня есть!", flaw: "document" }
        : { ...base, document: personName(look, rng), flaw: "document" };
    case "deadPhone":
      return { ...base, ticket: null, line: "Телефон сел, а билет в приложении… Пустите, я в вагоне заряжу?" };
    case "pet":
      return { ...base, carry: "pet", line: pick(["Он спокойный, на руках посидит.", "Переноску дома забыли — пустите?"], rng) };
    case "bike":
      return { ...base, carry: "bike", line: "Велосипед с собой — в тамбуре поставлю, никому не помешает." };
    case "parcel":
      return { ...base, ticket: null, document: null, carry: "parcel", line: "Я не еду — передайте коробочку, на конечной встретят. Она совсем маленькая!" };
    case "drunk":
      return { ...base, drunk: true, line: pick(["(громко) Ну что, командир, пускай! Праздник же!", "(покачиваясь) Пятый вагон… или шестой… Пускайте!"], rng) };
  }
}

// Очередь рейса: половина — «всё в порядке», остальные — ситуации, открытые к этому рейсу.
// Новые правила рейса попадают в очередь первыми, чтобы каждое встретилось хотя бы раз
export function makeQueue(round: Round, rng: Rng = Math.random): Passenger[] {
  const { passengers } = ROUNDS[round];
  const open = (Object.keys(CASES) as Kind[]).filter((kind) => kind !== "ok" && CASES[kind].round <= round);
  const fresh = shuffle(open.filter((kind) => CASES[kind].round === round), rng);
  const cases: Kind[] = [];
  const problems = passengers - Math.floor(passengers / 2);
  for (let i = 0; i < problems; i++) cases.push(i < fresh.length ? fresh[i] : pick(open, rng));
  while (cases.length < passengers) cases.push("ok");
  return shuffle(cases, rng).map((kind) => makePassenger(kind, round, rng));
}

export function judge(passenger: Passenger, action: Action): Decision {
  const rule = CASES[passenger.kind];
  if (action === rule.correct) {
    return { passenger, action, verdict: "correct", ...(passenger.kind === "ok" ? SCORING.correctOk : SCORING.correctCase) };
  }
  if (rule.weak.includes(action)) return { passenger, action, verdict: "weak", ...SCORING.weak };
  return { passenger, action, verdict: "wrong", ...(action === "board" ? SCORING.wrongBoard : SCORING.wrongOther) };
}

export function starsFor(accuracy: number): Result["stars"] {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= 0.4) return 1;
  return 0;
}

export function summarize(decisions: Decision[], missed: number, lateOpened: boolean | null): Result {
  const late = lateOpened === null ? null : lateOpened ? SCORING.lateOpened : SCORING.lateKept;
  const parts = [...decisions, ...Array.from({ length: missed }, () => SCORING.missed), ...(late ? [late] : [])];
  const correct = decisions.filter((d) => d.verdict === "correct").length;
  // Не успели посадить — тоже промах: точность считается по всем, кто стоял в очереди
  const total = decisions.length + missed;
  return {
    points: parts.reduce((sum, p) => sum + p.points, 0),
    safety: parts.reduce((sum, p) => sum + p.safety, 0),
    loyalty: parts.reduce((sum, p) => sum + p.loyalty, 0),
    correct,
    total,
    stars: starsFor(total === 0 ? 0 : correct / total),
    mistakes: decisions.filter((d) => d.verdict !== "correct"),
    missed,
    lateOpened,
  };
}
