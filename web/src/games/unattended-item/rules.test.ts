import { describe, expect, it } from "vitest";
import { ITEMS, isFinished, judge, type Play } from "./rules";

const play = (overrides: Partial<Play>): Play => ({ kind: "bag", found: true, actions: [], wrongTaps: 0, ...overrides });

describe("judge: сумка без владельца", () => {
  it("объявили и сообщили по рации — хорошо", () => {
    const result = judge(play({ actions: ["announce", "radio"] }));
    expect([result.outcome, result.safetyDelta, result.loyaltyDelta]).toEqual(["good", 25, 10]);
  });

  it("выясняли владельца до рации — с замечанием", () => {
    expect(judge(play({ actions: ["announce", "ask", "radio"] })).outcome).toBe("ok");
    expect(judge(play({ actions: ["announce", "radio", "ask"] })).outcome).toBe("good");
  });

  it("открыли или разрешили унести — плохо", () => {
    expect(judge(play({ actions: ["announce", "open"] })).outcome).toBe("bad");
    expect(judge(play({ actions: ["announce", "radio"], event: { id: "grab", choice: "allow" } })).outcome).toBe("bad");
  });
});

describe("judge: правильный ответ зависит от находки", () => {
  it("рюкзак известного владельца: рация — лишняя тревога", () => {
    expect(judge(play({ kind: "backpack", actions: ["ask", "callOwner"] })).outcome).toBe("good");
    expect(judge(play({ kind: "backpack", actions: ["ask", "radio", "callOwner"] })).outcome).toBe("ok");
  });

  it("запах гари: выяснять владельца некогда", () => {
    expect(judge(play({ kind: "smoke", actions: ["radio", "evacuate"] })).outcome).toBe("good");
    expect(judge(play({ kind: "smoke", actions: ["ask", "radio", "evacuate"] })).outcome).toBe("ok");
  });

  it("игрушка в проходе: убрать и найти владельца, без ПТБ", () => {
    expect(judge(play({ kind: "toy", actions: ["clear", "ask"] })).outcome).toBe("good");
    expect(judge(play({ kind: "toy", actions: ["announce", "clear", "ask"] })).outcome).toBe("ok");
  });
});

describe("judge: события и промахи", () => {
  it("не ответили пассажиру с чаем — замечание; сначала чай — не ошибка", () => {
    expect(judge(play({ actions: ["announce", "radio"], event: { id: "tea", choice: "ignore" } })).outcome).toBe("ok");
    expect(judge(play({ actions: ["announce", "radio"], event: { id: "tea", choice: "serve" } })).outcome).toBe("good");
  });

  it("не нашли вовремя — плохо; лишние касания стоят лояльности", () => {
    expect(judge(play({ found: false })).outcome).toBe("bad");
    expect(judge(play({ actions: ["radio", "announce"], wrongTaps: 2 })).loyaltyDelta).toBe(0);
  });

  it("у каждой находки своя концовка и урок из памятки", () => {
    const result = judge(play({ kind: "smoke", actions: ["radio", "evacuate"] }));
    expect(result.ending).toBe(ITEMS.smoke.endings.good);
    expect(result.notes.at(-1)).toBe(ITEMS.smoke.lesson);
  });
});

describe("isFinished", () => {
  it("конец — после обязательных шагов этой находки или нарушения", () => {
    expect([isFinished("bag", ["announce"]), isFinished("bag", ["announce", "radio"]), isFinished("bag", ["carry"])]).toEqual([false, true, true]);
    expect(isFinished("toy", ["clear", "ask"])).toBe(true);
  });
});
