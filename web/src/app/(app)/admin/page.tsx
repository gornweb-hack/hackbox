"use client";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHealth } from "@/lib/health";

const SERVICES = [
  { key: "core", title: "Ядро", description: "Вход, сотрудники, уведомления" },
  { key: "db", title: "База данных", description: "Сотрудники и данные приложения" },
  { key: "redis", title: "Redis", description: "События и уведомления" },
] as const;

// Состояние системы: здоровье ядра, базы и Redis (опрос раз в 10 с)
export default function SystemStatusPage() {
  const { data: health } = useHealth();

  return (
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
  );
}
