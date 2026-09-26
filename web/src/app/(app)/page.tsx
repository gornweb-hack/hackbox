"use client";

import { ROLE_LABELS, useMe } from "@/lib/auth";

// Главная: приветствие и роль вошедшего
export default function HomePage() {
  const { data: me } = useMe();
  if (!me) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Здравствуйте, {me.name}</h1>
      <p className="text-sm text-muted-foreground">{ROLE_LABELS[me.role]}</p>
    </div>
  );
}
