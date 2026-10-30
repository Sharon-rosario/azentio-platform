import { cn } from "@/lib/utils";

/** The azentio.ai mark: a mint node on a navy tile, in Azentio's brand colours. */
export function Mark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("bg-navy grid size-8 place-items-center rounded-[10px] ring-1 ring-white/10", className)}>
      <span className="bg-brand size-2.5 rounded-full shadow-[0_0_0_4px_color-mix(in_oklch,var(--brand),transparent_70%)]" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]", className)}>
      <Mark className="size-7" />
      <span>
        azentio<span className="text-brand-strong">.ai</span>
      </span>
    </span>
  );
}
