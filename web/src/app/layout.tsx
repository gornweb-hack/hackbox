import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { PageBackdrop } from "@/components/page-backdrop";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Рейс 400",
  description: "Тренажёр проводника ВСМ-400",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Шрифт из пакета geist, а не с Google: сборка не зависит от интернета на площадке
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Стекло читается только на фоне: он лежит под всеми страницами, контент — слоем выше */}
        <PageBackdrop />
        <div className="relative z-1 flex flex-1 flex-col">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
