import { ArrowRight, type LucideIcon } from "lucide-react";
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

/** A ledger figure: label, number, what it means. Ruled on top, no card; with href it opens the list it counts. */
export function StatTile({
  label,
  value,
  hint,
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <span className="text-muted-foreground flex items-center justify-between gap-2 text-[14px] leading-5">
        {label}
        {href && <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={1.5} />}
      </span>
      <span className="mt-3 block text-[44px] leading-[48px] font-normal tracking-[-0.025em] tabular-nums">{value}</span>
      {hint && <span className="text-muted-foreground mt-1 block text-[13px] leading-[18px]">{hint}</span>}
    </>
  );
  const cls = cn("block border-t pt-4 pb-1", className);
  return href ? (
    <Link href={href} className={cn(cls, "group hover:border-foreground focus-visible:ring-ring rounded-none outline-none transition-colors duration-150 focus-visible:ring-2")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
