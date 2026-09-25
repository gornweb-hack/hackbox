import { type NextRequest, NextResponse } from "next/server";

// Без cookie входа — сразу на /login, чтобы не мигала пустая страница.
// Это только быстрая переадресация: права проверяет ядро, а истёкший токен обновляет клиент API
export function proxy(request: NextRequest) {
  if (request.cookies.has("hb_access")) return NextResponse.next();
  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Всё, кроме API ядра, входа, статики Next и файлов вроде favicon.ico
  matcher: ["/((?!api|login|_next/static|_next/image|.*\\..*).*)"],
};
