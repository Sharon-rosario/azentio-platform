import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

// AIRA is one agent, shown the same way wherever it works: theme summaries, the moderator's identifier check and
// rewrite, and autonomous review of the queue. Its shared context lives in server/llm.ts (AIRA).

/** AIRA's badge: the mint mark and its name, optionally with the job it is doing here. */
export function AiraMark({ job, tone = "light", className }: { job?: string; tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px] leading-5", className)}>
      <span aria-hidden className="grid size-6 place-items-center rounded-lg bg-[#2ed88e] text-[#16303d] shadow-sm">
        <Sparkles className="size-3.5" strokeWidth={2.5} />
      </span>
      <span className="font-semibold tracking-wide">AIRA</span>
      {job && <span className={tone === "dark" ? "text-navy-muted" : "text-muted-foreground"}>· {job}</span>}
    </span>
  );
}

/** The line under anything AIRA produced: who made it, with which model, and that a person checks it. */
export function AiraFootnote({ model, children, className }: { model?: string | null; children?: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-muted-foreground text-[12px] leading-[18px]", className)}>
      By AIRA, Azentio&apos;s AI agent{model ? ` (${model})` : ""}. {children ?? "It can miss things, so a person checks what it produces."}
    </p>
  );
}
