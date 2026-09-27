import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

// Ссылка «назад» над заголовком страницы: ведёт в раздел, а не по истории браузера — так она работает
// и когда страницу открыли по прямой ссылке или из уведомления
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-4" />
      {children}
    </Link>
  );
}
