"use client";

import { BellIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AppNotification,
  type NotificationList,
  timeAgo,
  useCloseNotifications,
  useMarkRead,
  useNotifications,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const DOTS: Record<AppNotification["level"], string> = {
  success: "bg-zone-green",
  warning: "bg-zone-yellow",
  info: "bg-primary",
};

// Центр уведомлений: всё, что приходило тостами, — новые сверху. Открыли страницу — всё прочитано
export default function NotificationsPage() {
  const { data, isPending, isError } = useNotifications();
  const close = useCloseNotifications();

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Уведомления</h1>
          <p className="text-sm text-muted-foreground">Новые уровни, ачивки и новости тренажёра. Последние 50.</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть уведомления"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-card transition-colors outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:bg-muted"
        >
          <XIcon className="size-5" />
        </button>
      </div>
      {isPending ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Уведомления недоступны. Обновите страницу чуть позже.</p>
      ) : (
        <Inbox list={data} />
      )}
    </div>
  );
}

// Монтируется, когда список уже загружен: непрочитанные на момент открытия запоминаются и остаются
// выделенными, хотя ядро сразу отмечает их прочитанными
function Inbox({ list }: { list: NotificationList }) {
  const [fresh] = useState(() => new Set(list.items.filter((item) => item.readAt === null).map((item) => item.id)));
  const { mutate: markRead } = useMarkRead();

  // Пришло новое, пока страница открыта, — тоже прочитано
  useEffect(() => {
    if (list.unread > 0) markRead();
  }, [list.unread, markRead]);

  if (list.items.length === 0) {
    return (
      <section className="flex flex-col items-center gap-2 rounded-xl border bg-card px-5 py-10 text-center shadow-card">
        <BellIcon className="size-8 text-muted-foreground" />
        <p className="text-[15px] font-medium">Пока уведомлений нет</p>
        <p className="text-sm text-muted-foreground">Здесь появятся новые уровни, ачивки и новости тренажёра.</p>
      </section>
    );
  }

  return (
    <ol className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-card">
      {list.items.map((item) => {
        const unread = item.readAt === null || fresh.has(item.id);
        return (
          <li key={item.id} className={cn("flex gap-3 border-b px-5 py-4 last:border-b-0", unread && "bg-primary-soft/60")}>
            <span className={cn("mt-2 size-2 shrink-0 rounded-full", DOTS[item.level])} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("text-[15px]", unread ? "font-semibold" : "font-medium")}>{item.title}</span>
                <span className="shrink-0 text-[12px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
              </div>
              {item.message && <p className="text-sm leading-snug text-muted-foreground">{item.message}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
