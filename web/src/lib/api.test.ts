import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, setSessionLostHandler } from "./api";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let sessionLost: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    sessionLost = vi.fn<() => void>();
    setSessionLostHandler(sessionLost);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("возвращает JSON успешного ответа", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: 1 }));
    await expect(api("/api/x")).resolves.toEqual({ ok: 1 });
  });

  it("ошибка ядра превращается в ApiError с code и message", async () => {
    fetchMock.mockResolvedValueOnce(json(409, { code: "LOGIN_TAKEN", message: "Занят" }));
    await expect(api("/api/users", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 409,
      code: "LOGIN_TAKEN",
      message: "Занят",
    });
  });

  it("TOKEN_EXPIRED: обновляет сессию и повторяет запрос", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { code: "TOKEN_EXPIRED", message: "" }))
      .mockResolvedValueOnce(json(200, {}))
      .mockResolvedValueOnce(json(200, { me: 1 }));
    await expect(api("/api/auth/me")).resolves.toEqual({ me: 1 });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/auth/me", "/api/auth/refresh", "/api/auth/me"]);
    expect(sessionLost).not.toHaveBeenCalled();
  });

  it("несколько одновременных TOKEN_EXPIRED — один refresh", async () => {
    let refreshed = false;
    let finishRefresh: (() => void) | undefined;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/auth/refresh") {
        await new Promise<void>((resolve) => (finishRefresh = resolve));
        refreshed = true;
        return json(200, {});
      }
      return refreshed ? json(200, { url }) : json(401, { code: "TOKEN_EXPIRED", message: "" });
    });

    const pending = Promise.all([api("/api/a"), api("/api/b"), api("/api/c")]);
    await vi.waitFor(() => expect(finishRefresh).toBeDefined());
    finishRefresh!();

    await expect(pending).resolves.toEqual([{ url: "/api/a" }, { url: "/api/b" }, { url: "/api/c" }]);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
  });

  it("refresh не удался — потеря сессии и ошибка", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { code: "TOKEN_EXPIRED", message: "" }))
      .mockResolvedValueOnce(json(401, { code: "REFRESH_INVALID", message: "" }));
    await expect(api("/api/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(sessionLost).toHaveBeenCalledOnce();
  });

  it("TOKEN_INVALID — сразу потеря сессии, без refresh", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { code: "TOKEN_INVALID", message: "" }));
    await expect(api("/api/auth/me")).rejects.toMatchObject({ code: "TOKEN_INVALID" });
    expect(sessionLost).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("204 — без тела", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api("/api/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });
});
