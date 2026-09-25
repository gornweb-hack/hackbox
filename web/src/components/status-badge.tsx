import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Зелёная или красная плашка состояния: работает / недоступен / проверяем
export function StatusBadge({ status }: { status: "up" | "down" | "unknown" }) {
  const label = status === "up" ? "работает" : status === "down" ? "недоступен" : "проверяем";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        status === "up" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
        status === "down" && "border-destructive/40 text-destructive",
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full bg-muted-foreground",
          status === "up" && "bg-emerald-500",
          status === "down" && "bg-destructive",
        )}
      />
      {label}
    </Badge>
  );
}
