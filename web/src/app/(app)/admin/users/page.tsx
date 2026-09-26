"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import { type Role, ROLE_LABELS } from "@/lib/auth";

interface User {
  id: string;
  login: string;
  name: string;
  email: string | null;
  role: Role;
  crew: string | null;
  depot: string | null;
  createdAt: string;
}

const USERS_KEY = ["users"] as const;
const ROLES = Object.keys(ROLE_LABELS) as Role[];

// «Бригада 3 · Депо Москва-ВСМ» или null, если ничего не назначено
const crewOf = (user: User) => [user.crew, user.depot].filter(Boolean).join(" · ") || null;

// Сотрудники: список, создание и правка. Аккаунты заводит администратор
export default function UsersPage() {
  const { data, isPending } = useQuery({
    queryKey: USERS_KEY,
    queryFn: () => api<{ items: User[]; total: number }>("/api/users"),
  });
  const [editing, setEditing] = useState<User | "new" | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Сотрудники {data && <span className="text-muted-foreground">({data.total})</span>}</h1>
        <Button onClick={() => setEditing("new")}>
          <PlusIcon /> Добавить
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {/* Телефон: карточки */}
          <div className="flex flex-col gap-3 md:hidden">
            {data?.items.map((user) => (
              <Card key={user.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    {user.name}
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(user)} aria-label="Изменить">
                      <PencilIcon />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span>{user.login}</span>
                  <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                  {user.email && <span>{user.email}</span>}
                  {crewOf(user) && <span>{crewOf(user)}</span>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Компьютер: таблица */}
          <Card className="hidden md:flex">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Логин</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Бригада · Депо</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.login}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{crewOf(user) ?? "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(user)} aria-label="Изменить">
                          <PencilIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <UserDialog user={editing} onClose={() => setEditing(null)} />
    </>
  );
}

// Создание (user === "new") или правка сотрудника
function UserDialog({ user, onClose }: { user: User | "new" | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isNew = user === "new";
  const current = isNew ? null : user;

  const save = useMutation({
    mutationFn: (body: Record<string, string>) =>
      isNew ? api<User>("/api/users", { method: "POST", body }) : api<User>(`/api/users/${current!.id}`, { method: "PATCH", body }),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success(isNew ? `Сотрудник ${saved.name} добавлен` : "Изменения сохранены");
      onClose();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // Пустые поля не отправляем: при правке это значит «не менять». Исключение — бригада и депо:
    // если их стёрли, ядро очищает поле по пустой строке
    const body = Object.fromEntries(
      [...form.entries()].filter(([key, value]) => value !== "" || ((key === "crew" || key === "depot") && current?.[key])),
    ) as Record<string, string>;
    save.mutate(body);
  }

  const error = save.error instanceof ApiError ? save.error.message : save.error ? "Не удалось сохранить" : null;

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) {
          save.reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "Новый сотрудник" : "Изменить сотрудника"}</DialogTitle>
        </DialogHeader>
        {user !== null && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Имя" name="name" defaultValue={current?.name} required={isNew} />
            {isNew && <Field label="Логин (табельный номер, телефон или email)" name="login" required autoCapitalize="none" />}
            <Field label="Email" name="email" type="email" defaultValue={current?.email ?? ""} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Роль</Label>
              <select
                id="role"
                name="role"
                defaultValue={current?.role ?? "USER"}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Бригада" name="crew" defaultValue={current?.crew ?? ""} placeholder="Бригада 3" />
              <Field label="Депо" name="depot" defaultValue={current?.depot ?? ""} placeholder="Депо Москва-ВСМ" />
            </div>
            <Field
              label={isNew ? "Пароль (от 6 символов)" : "Новый пароль (пусто — не менять)"}
              name="password"
              type="password"
              required={isNew}
              autoComplete="new-password"
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Сохраняем…" : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
