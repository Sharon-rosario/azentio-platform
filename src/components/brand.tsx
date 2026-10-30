import { cn } from "@/lib/utils";

/** The azentio.ai mark: a green node in a dark tile. */
export function Mark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("bg-foreground grid size-8 place-items-center rounded-[10px]", className)}>
      <span className="bg-brand size-2.5 rounded-full shadow-[0_0_0_4px_color-mix(in_oklch,var(--brand),transparent_75%)]" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[17px] font-medium tracking-[-0.01em]", className)}>
      <Mark className="size-7" />
      <span>
        azentio<span className="text-primary">.ai</span>
      </span>
    </span>
  );
}
