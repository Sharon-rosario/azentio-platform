import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Highlight } from "@/components/site/highlight";
import { date } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Content } from "@/server/content";

/*
 * Public-site primitives shared by the inner pages: the navy title band, entries as cards, dated broadcast rows and
 * pale-mint notes. Mono only for identifiers, dates and labels.
 */

type Vars = CSSProperties & Record<`--${string}`, string>;

/**
 * The inner pages' opening band: full width, navy like the home hero, with the same dot grid, mint glow and rising
 * entrance. `highlight` draws the mint underline under part of the title; `art` puts an illustration on the right.
 */
export function SiteTitle({
  title,
  highlight,
  back,
  children,
  action,
  art,
}: {
  title: string;
  highlight?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
  action?: ReactNode;
  art?: ReactNode;
}) {
  const at = highlight ? title.lastIndexOf(highlight) : -1;
  return (
    // Bleeds out of the page container to the viewport edges; the body clips the scrollbar's few pixels.
    <header className="bg-navy relative mx-[calc(50%-50vw)] -mt-10 overflow-hidden text-white sm:-mt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgb(255_255_255/0.14)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
      />
      <div aria-hidden className="bg-brand/20 pointer-events-none absolute -top-24 right-[6%] hidden size-[380px] rounded-full blur-[110px] md:block" />
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 pt-10 pb-12 sm:px-6 md:pt-14 md:pb-16 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className={art ? "lg:col-span-7" : "lg:col-span-8"}>
          {back && (
            <Link
              href={back.href}
              className="hero-rise text-navy-muted hover:text-brand mb-6 inline-flex items-center gap-1.5 rounded-sm text-[14px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ArrowLeft aria-hidden className="size-4" /> {back.label}
            </Link>
          )}
          <h1
            className="hero-rise text-[34px] leading-[40px] font-semibold tracking-[-0.025em] text-balance sm:text-[40px] sm:leading-[46px] md:text-[56px] md:leading-[62px] md:tracking-[-0.03em]"
            style={{ "--d": "60ms" } as Vars}
          >
            {at >= 0 ? (
              <>
                {title.slice(0, at)}
                <Highlight>{highlight}</Highlight>
                {title.slice(at + highlight!.length)}
              </>
            ) : (
              title
            )}
          </h1>
          {children && (
            <p className="hero-rise text-navy-muted mt-6 max-w-[38rem] text-[18px] leading-[28px]" style={{ "--d": "140ms" } as Vars}>
              {children}
            </p>
          )}
          {art && action && <div className="hero-rise mt-8" style={{ "--d": "220ms" } as Vars}>{action}</div>}
        </div>
        {art ? (
          <div className="hero-rise text-foreground lg:col-span-5" style={{ "--d": "180ms" } as Vars}>{art}</div>
        ) : (
          action && <div className="hero-rise lg:col-span-4 lg:justify-self-end" style={{ "--d": "220ms" } as Vars}>{action}</div>
        )}
      </div>
    </header>
  );
}

/** Pieces without their own page (solutions, insights): title in the left column, the text on the right. */
export function EntryIndex({ items, empty }: { items: Content[]; empty: string }) {
  if (!items.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.id} data-reveal>
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
    <aside data-reveal className={cn("bg-brand-soft h-fit rounded-2xl border border-[color-mix(in_oklch,var(--brand-strong),transparent_70%)] p-6", className)}>
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
