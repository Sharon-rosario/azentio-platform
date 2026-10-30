import { ArrowRight, CalendarDays, Radio } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/states";
import { date } from "@/lib/format";
import type { Content } from "@/server/content";

/** A product as a card that opens its page. */
export function ProductCard({ product }: { product: Content }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="bg-card group hover:border-border focus-visible:ring-ring flex h-full flex-col rounded-2xl border border-transparent p-5 transition-colors outline-none focus-visible:ring-2"
    >
      <h3 className="text-[15px] leading-5 font-medium">{product.title}</h3>
      <p className="text-muted-foreground mt-1.5 flex-1 text-[14px] leading-[22px]">{product.summary}</p>
      <span className="text-primary mt-4 inline-flex items-center gap-1 text-[13px] font-medium">
        View product <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Content[] }) {
  if (!products.length) {
    return (
      <div className="bg-card rounded-2xl">
        <EmptyState title="No products listed yet" description="The product catalogue is empty. Run the seed to load it." />
      </div>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

/** A piece of content without its own page (solution, insight): title and summary on a white card. */
export function ContentCard({ item }: { item: Content }) {
  return (
    <article className="bg-card h-full rounded-2xl p-5">
      <h3 className="text-[15px] leading-5 font-medium">{item.title}</h3>
      <p className="text-muted-foreground mt-1.5 text-[14px] leading-[22px]">{item.summary}</p>
      {item.body && <p className="mt-3 text-[14px] leading-[22px] whitespace-pre-line">{item.body}</p>}
    </article>
  );
}

/** Public broadcasts with their date. Upcoming ones first; the caller decides which to pass. */
export function BroadcastList({ items, empty = "No public broadcasts scheduled" }: { items: Content[]; empty?: string }) {
  if (!items.length) return <EmptyState icon={Radio} title={empty} description="New sessions are listed here when they're announced." />;
  return (
    <ul className="divide-y">
      {items.map((b) => (
        <li key={b.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-full">
            <Radio className="text-muted-foreground size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium">{b.title}</p>
            <p className="text-muted-foreground text-[13px]">{b.summary}</p>
            {b.starts_at && (
              <p className="text-muted-foreground mt-1 inline-flex items-center gap-1.5 text-[12px] tabular-nums">
                <CalendarDays className="size-3.5" /> {date(b.starts_at)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Broadcasts that haven't started yet, soonest first. */
export function upcoming(items: Content[]) {
  const now = Date.now();
  return items
    .filter((b) => b.starts_at && new Date(b.starts_at).getTime() >= now)
    .sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
}
