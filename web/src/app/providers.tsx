"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type CSSProperties, type ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Ошибки 4xx повторять бессмысленно; сбои сети и 5xx — до двух раз
            retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Тосты тёмные, как в макете: переменные темы Sonner берут токен toast, радиус 14.
          Цвет описания у Sonner задан своим селектором, поэтому перебиваем его с important */}
      <Toaster
        position="top-center"
        style={
          {
            "--normal-bg": "var(--toast)",
            "--normal-border": "var(--toast)",
            "--normal-text": "#fff",
            "--border-radius": "14px",
          } as CSSProperties
        }
        toastOptions={{ classNames: { description: "text-[#c3c9d3]!" } }}
      />
    </QueryClientProvider>
  );
}
