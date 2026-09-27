import { describe, expect, it } from "vitest";
import { type Action, CASES, judge, type Kind, makePassenger, makeQueue, ROUNDS, SCORING, starsFor, summarize } from "./rules";

// Детерминированный генератор (mulberry32): одна и та же очередь при каждом прогоне
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KINDS = Object.keys(CASES) as Kind[];

describe("judge", () => {
  it("верное действие каждой ситуации — по таблице CASES", () => {
    for (const kind of KINDS) {
      expect(judge(makePassenger(kind, 3, seeded(1)), CASES[kind].correct).verdict, kind).toBe("correct");
    }
  });

  it("пустил того, кого нельзя, — удар по безопасности", () => {
    const decision = judge(makePassenger("drunk", 3, seeded(2)), "board");
    expect([decision.verdict, decision.safety]).toEqual(["wrong", SCORING.wrongBoard.safety]);
  });

  it("лишнее действие с порядочным пассажиром — удар по лояльности", () => {
    const decision = judge(makePassenger("ok", 3, seeded(3)), "carrier");
    expect([decision.verdict, decision.loyalty]).toEqual(["wrong", SCORING.wrongOther.loyalty]);
  });

  it("отказ без альтернативы пассажиру с питомцем — слабо", () => {
    expect(judge(makePassenger("pet", 2, seeded(4)), "refuse").verdict).toBe("weak");
  });
});

describe("makePassenger", () => {
  it("обманки — только у «всё в порядке» и только с рейса их правила", () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(makePassenger("ok", 1, seeded(seed)).carry).toBeNull();
      expect(makePassenger("ok", 2, seeded(seed)).carry).not.toBe("bikeFolded");
    }
    const carries = new Set(Array.from({ length: 200 }, (_, seed) => makePassenger("ok", 3, seeded(seed)).carry));
    expect(carries).toEqual(new Set([null, "petInCarrier", "bikeFolded"]));
  });

  it("у ситуации с билетом есть что заметить: неверная дата, время или документ", () => {
    for (let seed = 0; seed < 50; seed++) {
      const ticket = makePassenger("invalidTicket", 1, seeded(seed));
      expect(ticket.ticket?.day !== 0 || ticket.ticket?.time !== "14:40").toBe(true);
      const document = makePassenger("noDocument", 2, seeded(seed));
      expect(document.document).not.toBe(document.ticket?.name);
    }
  });
});

describe("makeQueue", () => {
  it("в очереди только правила, открытые к этому рейсу, и каждое новое — хотя бы раз", () => {
    for (let seed = 0; seed < 50; seed++) {
      const round1 = makeQueue(1, seeded(seed));
      expect(round1).toHaveLength(ROUNDS[1].passengers);
      expect(round1.every((p) => CASES[p.kind].round === 1)).toBe(true);

      const kinds3 = new Set(makeQueue(3, seeded(seed)).map((p) => p.kind));
      for (const kind of ["bike", "parcel", "drunk"] as Kind[]) expect(kinds3.has(kind)).toBe(true);
    }
  });

  it("половина очереди — «всё в порядке»", () => {
    const queue = makeQueue(2, seeded(7));
    expect(queue.filter((p) => p.kind === "ok")).toHaveLength(ROUNDS[2].passengers / 2);
  });
});

describe("summarize", () => {
  const decide = (kind: Kind, action: Action) => judge(makePassenger(kind, 3, seeded(9)), action);

  it("складывает очки и шкалы решений, оставшихся в очереди и финала", () => {
    const result = summarize([decide("ok", "board"), decide("drunk", "board")], 1, true);
    expect(result.points).toBe(SCORING.correctOk.points + SCORING.wrongBoard.points + SCORING.lateOpened.points);
    expect(result.safety).toBe(SCORING.wrongBoard.safety + SCORING.lateOpened.safety);
    expect(result.loyalty).toBe(SCORING.correctOk.loyalty + SCORING.missed.loyalty);
    expect([result.correct, result.total, result.mistakes.length]).toEqual([1, 3, 1]);
  });

  it("звёзды по точности", () => {
    expect([0.95, 0.9, 0.75, 0.5, 0.2].map(starsFor)).toEqual([3, 3, 2, 1, 0]);
  });
});
