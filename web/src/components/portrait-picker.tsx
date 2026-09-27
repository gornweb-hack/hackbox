"use client";

import { toast } from "sonner";
import { Portrait, PORTRAITS } from "@/components/portrait";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSetAvatar } from "@/lib/auth";
import { initials } from "@/lib/names";
import { cn } from "@/lib/utils";

const TILE =
  "flex flex-col items-center gap-1.5 rounded-lg p-2 text-center text-xs leading-tight text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 aria-pressed:font-semibold aria-pressed:text-primary-text";
// Выбранный портрет — в синем кольце, как аватар в шапке
const RING = "size-16 rounded-full shadow-[0_0_0_2px_var(--popover)] group-aria-pressed:shadow-[0_0_0_2px_var(--popover),0_0_0_4px_var(--primary)]";

// Выбор портрета профиля из готового набора. Своих картинок не загружаем — только персонажи сценариев
export function PortraitPicker({
  open,
  onOpenChange,
  name,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  current: string | null;
}) {
  const { mutate, isPending } = useSetAvatar();
  const choose = (avatar: string | null) =>
    mutate(avatar, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => toast.error(error.message),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Портрет профиля</DialogTitle>
          <DialogDescription>Его видно в шапке. Выберите персонажа или оставьте инициалы.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {PORTRAITS.map((portrait) => (
            <button
              key={portrait.id}
              type="button"
              aria-pressed={current === portrait.id}
              disabled={isPending}
              onClick={() => choose(portrait.id)}
              className={cn("group", TILE)}
            >
              <span className={RING}>
                <Portrait id={portrait.id} />
              </span>
              {portrait.title}
            </button>
          ))}
          <button type="button" aria-pressed={current === null} disabled={isPending} onClick={() => choose(null)} className={cn("group", TILE)}>
            <span className={cn(RING, "flex items-center justify-center bg-[linear-gradient(160deg,#2b3140,#11141a)] text-lg font-semibold text-white")}>
              {initials(name)}
            </span>
            Инициалы
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
