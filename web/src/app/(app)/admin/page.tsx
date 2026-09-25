"use client";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHealth, useModules } from "@/lib/modules";

const SERVICES = [
  { key: "core", title: "Ядро", description: "Вход, прокси в модули, уведомления" },
  { key: "db", title: "База данных", description: "Пользователи и данные модулей" },
  { key: "redis", title: "Redis", description: "События между модулями" },
] as const;

function formatTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString("ru-RU") : "—";
}

// Состояние системы: здоровье ядра, базы и Redis (опрос раз в 10 с)
// и модули — строка меняется сразу, как только модуль упал или поднялся
export default function SystemStatusPage() {
  const { data: health } = useHealth();
  const { data: modules, isPending } = useModules();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {SERVICES.map((service) => (
          <Card key={service.key} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                {service.title}
                <StatusBadge status={health?.[service.key] ?? "unknown"} />
              </CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Модули</CardTitle>
          <CardDescription>
            Ядро проверяет каждый модуль раз в 5 секунд. Лежащий модуль скрывается у пользователей, остальное
            работает.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : !modules?.length ? (
            <p className="text-sm text-muted-foreground">Модули не подключены.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Модуль</TableHead>
                  <TableHead>Состояние</TableHead>
                  <TableHead className="text-right">Проверен</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.name}>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={module.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatTime(module.checkedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
