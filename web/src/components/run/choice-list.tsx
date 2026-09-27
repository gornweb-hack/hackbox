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
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 fill-mode-both glass glass-press relative min-h-[50px] rounded-lg px-5 py-3.5 text-left text-[15px] leading-snug outline-none hover:text-primary-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
