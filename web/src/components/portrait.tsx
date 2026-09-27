import { Bust } from "@/components/run/novel/bust";
import { LOOKS } from "@/components/run/scene/head";
import { cn } from "@/lib/utils";

// Портреты профиля — персонажи сценариев. id совпадают со списком AVATARS в ядре (core/src/users/users.service.ts):
// ядро принимает только их. Своих картинок нет — портрет рисуется тем же SVG, что и персонажи
export const PORTRAITS = [
  { id: "conductor", title: "Проводница", coat: "#23406b" },
  { id: "chief", title: "Начальник поезда", coat: "#18253d" },
  { id: "doctor", title: "Врач", coat: "#f4f5f7" },
  { id: "guard", title: "Сотрудник охраны", coat: "#2f3b4a" },
  { id: "elder", title: "Пассажир в очках", coat: "#6d727a" },
  { id: "neighbour", title: "Пассажирка в жемчуге", coat: "#a8462f" },
  { id: "man", title: "Пассажир", coat: "#8a6fb0" },
  { id: "redhead", title: "Рыжий пассажир", coat: "#5e8f6a" },
  { id: "woman", title: "Пассажирка", coat: "#b0506e" },
] as const satisfies readonly { id: keyof typeof LOOKS; title: string; coat: string }[];

export type PortraitId = (typeof PORTRAITS)[number]["id"];

export const portraitOf = (id: string | null) => PORTRAITS.find((portrait) => portrait.id === id) ?? null;

// Голова и плечи в круге на светлом фоне: тёмная форма на тёмном фоне бы потерялась
export function Portrait({ id, className }: { id: PortraitId; className?: string }) {
  const portrait = portraitOf(id)!;
  return (
    <span className={cn("block size-full overflow-hidden rounded-full bg-[#e4e8ee]", className)}>
      <Bust look={LOOKS[portrait.id]} coat={portrait.coat} emotion="smile" viewBox="15 50 170 170" />
    </span>
  );
}
