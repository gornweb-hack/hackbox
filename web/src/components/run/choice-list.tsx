import type { RunView } from "@/lib/runs";

type Node = NonNullable<RunView["node"]>;

// Варианты ответа появляются по одному, когда ситуация дочитана
export function ChoiceList({ node, pending, onChoose }: { node: Node; pending: boolean; onChoose: (choiceId: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {node.choices.map((choice, index) => (
        <button
          key={`${node.id}:${choice.id}`}
          type="button"
          disabled={pending}
          onClick={() => onChoose(choice.id)}
          style={{ animationDelay: `${index * 90}ms` }}
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 fill-mode-both min-h-11 rounded-lg border bg-card px-4 py-3 text-left text-[15px] leading-snug shadow-card transition-colors outline-none hover:border-primary-soft-border hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[.995] disabled:opacity-60"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
