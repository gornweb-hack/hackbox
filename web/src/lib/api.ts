// Клиент API ядра. Фронт и ядро на одном адресе (rewrites в next.config.ts),
// поэтому запросы идут на /api/... и cookie входа уходят сами

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// После этих ответов сессию не восстановить — нужен повторный вход
const SESSION_LOST = new Set(["UNAUTHORIZED", "TOKEN_INVALID", "REFRESH_INVALID"]);

let onSessionLost = (): void => {
  if (window.location.pathname.startsWith("/login")) return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  // Полная перезагрузка, а не роутер: клиент API живёт вне React, а заодно сбрасываются кэш и SSE
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${next}`);
};

// Для тестов: подменить действие при потере сессии
export function setSessionLostHandler(handler: () => void): void {
  onSessionLost = handler;
}

// Один refresh на все запросы, которые одновременно получили TOKEN_EXPIRED
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options);

  if (res.status === 401) {
    const error = await toError(res);
    // Access-токен истёк: обновляем сессию и повторяем запрос один раз
    if (error.code === "TOKEN_EXPIRED" && (await refreshSession())) {
      res = await send(path, options);
    } else {
      if (SESSION_LOST.has(error.code) || error.code === "TOKEN_EXPIRED") onSessionLost();
      throw error;
    }
  }

  if (!res.ok) {
    const error = await toError(res);
    if (res.status === 401) onSessionLost();
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function send(path: string, { method = "GET", body, signal }: RequestOptions): Promise<Response> {
  return fetch(path, {
    method,
    signal,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// Ошибки ядра и модулей приходят в формате контракта {code, message}
async function toError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as { code?: string; message?: string };
    return new ApiError(res.status, body.code ?? "ERROR", body.message ?? res.statusText);
  } catch {
    return new ApiError(res.status, "ERROR", res.statusText || "Ошибка сети");
  }
}
