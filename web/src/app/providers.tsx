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
      {/* Тосты — тёмное стекло, как в макете: переменные темы Sonner берут токен toast, радиус 26, размытие и блик кромки.
          Цвет описания и тень у Sonner заданы своими селекторами, поэтому перебиваем их с important */}
      <Toaster
        position="top-center"
        style={
          {
            "--normal-bg": "var(--toast)",
            "--normal-border": "rgb(255 255 255 / 0.08)",
            "--normal-text": "#fff",
            "--border-radius": "26px",
          } as CSSProperties
        }
        toastOptions={{
          classNames: {
            toast:
              "backdrop-blur-[26px] backdrop-saturate-185 shadow-[0_18px_40px_-14px_rgb(10_20_60/.55),inset_0_1px_0_rgb(255_255_255/.2)]!",
            description: "text-[#c3c9d3]!",
          },
        }}
      />
    </QueryClientProvider>
  );
}
