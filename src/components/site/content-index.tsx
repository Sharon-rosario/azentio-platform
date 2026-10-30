import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { date } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Content } from "@/server/content";

/*
 * Public-site primitives. One visual language for every public page: flush-left display type, hairline rules as
 * structure, mono only for identifiers and dates. No cards: lists are ruled indexes, asides are ruled notes.
 */

/** A public page's opening: display title, standfirst, and at most one action. */
export function SiteTitle({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <header className="grid gap-6 border-b pb-10 md:pb-14 lg:grid-cols-12 lg:items-end lg:gap-6">
      <div className="lg:col-span-8">
        <h1 className="text-[44px] leading-[48px] font-normal tracking-[-0.025em] text-balance md:text-[60px] md:leading-[62px] md:tracking-[-0.03em]">
          {title}
        </h1>
        {children && <p className="text-muted-foreground mt-5 max-w-[38rem] text-[20px] leading-[28px] tracking-[-0.01em]">{children}</p>}
      </div>
      {action && <div className="lg:col-span-4 lg:justify-self-end">{action}</div>}
    </header>
  );
}

/** Products as a table of contents: name, what it does, and a door. */
export function ProductIndex({ products }: { products: Content[] }) {
  if (!products.length) return <Empty>No products are listed yet.</Empty>;
  return (
    <ul className="border-t">
      {products.map((p) => (
        <li key={p.id} className="border-b">
          <Link
            href={`/products/${p.slug}`}
            className="group focus-visible:bg-muted grid gap-2 py-6 transition-colors duration-150 outline-none md:grid-cols-12 md:items-baseline md:gap-6 md:py-7"
          >
            <span className="text-[24px] leading-[30px] tracking-[-0.015em] md:col-span-5">{p.title}</span>
            <span className="text-muted-foreground text-[15px] leading-6 md:col-span-6">{p.summary}</span>
            <ArrowUpRight
              aria-hidden
              strokeWidth={1.5}
              className="text-muted-foreground group-hover:text-foreground hidden size-5 justify-self-end transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:col-span-1 md:block"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Pieces without their own page (solutions, insights): title in the left column, the text on the right. */
export function EntryIndex({ items, empty }: { items: Content[]; empty: string }) {
  if (!items.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="border-t">
      {items.map((i) => (
        <li key={i.id}>
          <article className="grid gap-3 border-b py-8 md:grid-cols-12 md:gap-6">
            <h2 className="text-[24px] leading-[30px] tracking-[-0.015em] text-balance md:col-span-5">{i.title}</h2>
            <div className="md:col-span-7">
              <p className="text-[16px] leading-6">{i.summary}</p>
              {i.body && <p className="text-muted-foreground mt-3 text-[15px] leading-6 whitespace-pre-line">{i.body}</p>}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Public broadcasts as dated rows. The caller decides which ones (upcoming or past) to pass. */
export function BroadcastList({ items, empty }: { items: Content[]; empty: string }) {
  if (!items.length) return <p className="text-muted-foreground border-t py-4 text-[14px] leading-5">{empty}</p>;
  return (
    <ul className="border-t">
      {items.map((b) => (
        <li key={b.id} className="border-b py-4">
          {b.starts_at && <p className="text-muted-foreground font-mono text-[12px] leading-4 tabular-nums">{date(b.starts_at)}</p>}
          <p className="mt-1.5 text-[16px] leading-6 font-medium">{b.title}</p>
          <p className="text-muted-foreground text-[14px] leading-5">{b.summary}</p>
        </li>
      ))}
    </ul>
  );
}

/** A ruled side note with a mono label: what happens next, what to expect. */
export function Note({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <aside className={cn("border-t pt-5", className)}>
      <p className="text-muted-foreground font-mono text-[12px] leading-4">{label}</p>
      <div className="mt-3 text-[15px] leading-6">{children}</div>
    </aside>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground border-y py-8 text-[15px] leading-6">{children}</p>;
}

/** Broadcasts that haven't started yet, soonest first. */
export function upcoming(items: Content[]) {
  const now = Date.now();
  return items
    .filter((b) => b.starts_at && new Date(b.starts_at).getTime() >= now)
    .sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
}
