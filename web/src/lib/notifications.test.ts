import { describe, expect, it } from "vitest";
import { timeAgo } from "./notifications";

describe("timeAgo", () => {
  const now = Date.parse("2026-09-27T12:00:00Z");

  it("недавнее — в минутах и часах", () => {
    expect(timeAgo("2026-09-27T11:59:40Z", now)).toBe("только что");
    expect(timeAgo("2026-09-27T11:55:00Z", now)).toBe("5 мин назад");
    expect(timeAgo("2026-09-27T09:00:00Z", now)).toBe("3 ч назад");
  });

  it("старше суток — дата и время по Москве", () => {
    expect(timeAgo("2026-09-25T09:30:00Z", now)).toBe("25 сентября в 12:30");
  });
});
