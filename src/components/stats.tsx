import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { TONES, type Tone } from "@/components/status-badge";
import { cn } from "@/lib/utils";

/** Pill chip with an icon disc: the "Security · Armed Away" pattern from the reference. */
export function StatChip({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", TONES[tone])}>
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="flex flex-col pr-2 leading-tight">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">{value}</span>
      </span>
    </>
  );
  const cls =
    "bg-card flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-colors duration-150";
  return href ? (
    <Link href={href} className={cn(cls, "hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** KPI tile: one number, what it means, and how it's read. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("bg-card flex flex-col justify-between gap-6 rounded-2xl p-5", className)}>
      <div className="text-muted-foreground flex items-center justify-between text-[13px]">
        <span>{label}</span>
        {Icon && <Icon className="size-4" strokeWidth={1.75} />}
      </div>
      <div>
        <p className="text-[32px] leading-[38px] font-medium tracking-[-0.02em] tabular-nums">{value}</p>
        {hint && <p className="text-muted-foreground mt-1 text-[13px]">{hint}</p>}
      </div>
    </div>
  );
}
