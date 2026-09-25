"use client";

import { ModuleGate } from "@/components/module-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, useMe } from "@/lib/auth";
import { useModules } from "@/lib/modules";

// Главная. На хакатоне сюда встают блоки модулей, каждый — в своём ModuleGate
export default function HomePage() {
  const { data: me } = useMe();
  const { data: modules } = useModules();
  if (!me) return null;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Здравствуйте, {me.name}</h1>
        <p className="text-sm text-muted-foreground">{ROLE_LABELS[me.role]}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules?.map((module) => (
          <Card key={module.name}>
            <CardHeader>
              <CardTitle>Модуль {module.name}</CardTitle>
              <CardDescription>Пример блока, который виден только пока модуль жив</CardDescription>
            </CardHeader>
            <CardContent>
              <ModuleGate name={module.name}>
                <p className="text-sm">Здесь будет содержимое модуля {module.name}.</p>
              </ModuleGate>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
