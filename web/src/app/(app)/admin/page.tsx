"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { useHealth } from "@/lib/health";

const SERVICES = [
  { key: "core", title: "Ядро", description: "Вход, сотрудники, уведомления" },
  { key: "db", title: "База данных", description: "Сотрудники и данные приложения" },
  { key: "redis", title: "Redis", description: "События и уведомления" },
] as const;

// Состояние системы: здоровье ядра, базы и Redis (опрос раз в 10 с) и демо-данные для показа
export default function SystemStatusPage() {
  const { data: health } = useHealth();

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
      <DemoHistoryCard />
    </>
  );
}

// Прохождения синтетического штата за три недели — чтобы рейтингу и репутации было что показать.
// Повтор безопасен: ядро пропускает сотрудников, у которых уже есть прохождения
function DemoHistoryCard() {
  const generate = useMutation({
    mutationFn: () => api<{ users: number; runs: number }>("/api/scenarios/demo-history", { method: "POST" }),
    onSuccess: ({ users, runs }) =>
      users > 0
        ? toast.success("Демо-история готова", { description: `Сотрудников: ${users}, прохождений: ${runs}` })
        : toast.info("Демо-история уже есть", { description: "У всех сотрудников штата есть прохождения" }),
    onError: (error) => toast.warning("Демо-история не создана", { description: error instanceof ApiError ? error.message : undefined }),
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Демо-история</CardTitle>
        <CardDescription>Прохождения синтетических сотрудников за последние три недели — для рейтинга и репутации.</CardDescription>
        <CardAction>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? "Генерируем…" : "Сгенерировать"}
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
