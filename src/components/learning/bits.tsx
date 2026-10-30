// Small presentational pieces shared by the learning pages. No hooks: usable from server and client components.

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const CONSENT_LABEL: Record<string, string> = {
  store: "Store it in the portal",
  publish: "Publish a reviewed, de-identified copy",
  attribute: "Show the organisation's name with it",
  train: "Use in future model-training programmes",
};

/** Marks every flagged match inside a text, so the reader sees exactly what looks sensitive. */
export function Highlight({ text, matches }: { text: string; matches: string[] }) {
  const unique = [...new Set(matches.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!unique.length) return <>{text}</>;
  const re = new RegExp(`(${unique.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return (
    <>
      {text.split(re).map((part, i) =>
        unique.includes(part) ? (
          <mark key={i} className="bg-warning-soft text-warning rounded-[4px] px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Tabs that are plain links (?scope=…), so the server does the filtering and they work without JS. */
export function LinkTabs({ items, label }: { items: { href: string; label: string; active: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="bg-muted inline-flex h-10 w-fit items-center rounded-full p-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={cn(
            "focus-visible:ring-ring inline-flex h-full items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2",
            i.active ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

/** Label/value pairs in a two-column grid. */
export function Facts({ items, className }: { items: [string, ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 text-[14px] sm:grid-cols-2", className)}>
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-muted-foreground text-[12px]">{k}</dt>
          <dd className="mt-0.5 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
