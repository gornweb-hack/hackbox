import { AppShell } from "@/components/app-shell";

// Все страницы для вошедших: общий каркас и поток событий
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
