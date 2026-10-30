import { ArrowRight, Boxes, BriefcaseBusiness, FileChartColumn, Network, SlidersHorizontal, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProductArt } from "@/components/site/product-art";
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
        <h1 className="text-[44px] leading-[48px] font-semibold tracking-[-0.025em] text-balance md:text-[60px] md:leading-[62px] md:tracking-[-0.03em]">
          {title}
        </h1>
        {children && <p className="text-muted-foreground mt-5 max-w-[38rem] text-[20px] leading-[28px] tracking-[-0.01em]">{children}</p>}
      </div>
      {action && <div className="lg:col-span-4 lg:justify-self-end">{action}</div>}
    </header>
  );
}

/** Products as a table of contents: name, what it does, and a door. */
/** Product cards; `art` swaps the icon for a small illustration of what the product does (the home page). */
export function ProductIndex({ products, art = false }: { products: Content[]; art?: boolean }) {
  if (!products.length) return <Empty>No products are listed yet.</Empty>;
  return (
    <ul className={cn("grid gap-5", art ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2")}>
      {products.map((p) => {
        const Icon = PRODUCT_ICON[p.slug ?? ""] ?? Boxes;
        return (
          <li key={p.id}>
            <Link
              href={`/products/${p.slug}`}
              className={cn("group bg-card shadow-card hover:shadow-lift focus-visible:ring-ring flex h-full flex-col rounded-2xl border transition-[box-shadow,transform] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-2", art ? "p-4" : "p-6 md:p-7")}
            >
              {art ? (
                <ProductArt slug={p.slug} />
              ) : (
                <span className="bg-navy text-brand grid size-11 place-items-center rounded-xl">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
              )}
              <span className={cn("mt-5 font-semibold tracking-[-0.02em]", art ? "px-1 text-[18px] leading-6" : "text-[20px] leading-[28px]")}>{p.title}</span>
              <span className={cn("text-muted-foreground mt-2 flex-1", art ? "px-1 text-[14px] leading-[22px]" : "text-[15px] leading-6")}>{p.summary}</span>
              <span className={cn("text-primary mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium", art && "px-1 pb-1")}>
                Explore the product
                <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const PRODUCT_ICON: Record<string, LucideIcon> = {
  "credit-strategy-simulator": SlidersHorizontal,
  "sme-credit-decisioning": BriefcaseBusiness,
  "similar-portfolio-intelligence": Network,
  riva: FileChartColumn,
};

/** Pieces without their own page (solutions, insights): title in the left column, the text on the right. */
export function EntryIndex({ items, empty }: { items: Content[]; empty: string }) {
  if (!items.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.id}>
          <article className="bg-card shadow-card grid gap-3 rounded-2xl border p-6 md:grid-cols-12 md:gap-6 md:p-7">
            <h2 className="text-[20px] leading-[28px] tracking-[-0.02em] text-balance md:col-span-5">{i.title}</h2>
            <div className="md:col-span-7">
              <p className="text-[16px] leading-[26px]">{i.summary}</p>
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

/** A pale-mint side note with a mono label: what happens next, what to expect. */
export function Note({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <aside className={cn("bg-brand-soft h-fit rounded-2xl border border-[color-mix(in_oklch,var(--brand-strong),transparent_70%)] p-6", className)}>
      <p className="text-muted-foreground font-mono text-[12px] leading-4">{label}</p>
      <div className="mt-3 text-[15px] leading-6">{children}</div>
    </aside>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="bg-card text-muted-foreground rounded-2xl border p-8 text-[15px] leading-6">{children}</p>;
}

/** Broadcasts that haven't started yet, soonest first. */
export function upcoming(items: Content[]) {
  const now = Date.now();
  return items
    .filter((b) => b.starts_at && new Date(b.starts_at).getTime() >= now)
    .sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
}
