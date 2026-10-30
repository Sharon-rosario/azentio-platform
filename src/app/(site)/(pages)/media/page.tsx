import { ArrowUpRight, CalendarClock, Download, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Note, SiteTitle, upcoming } from "@/components/site/content-index";
import { dateTime } from "@/lib/format";
import { listContent } from "@/server/content";

export const metadata: Metadata = {
  title: "Media",
  description: "Public sessions, recordings, product walkthroughs and brand assets from azentio.ai.",
};

const ASSETS = [
  { href: "/icon.svg", label: "Mark (SVG)", note: "The azentio.ai mark, as used for the site icon" },
  { href: "/opengraph-image", label: "Share image (PNG, 1200 × 630)", note: "Used for every link preview" },
];

export default async function MediaPage() {
  // Signed out on purpose: this page lists only media whose audience is public. Client and employee sessions and
  // recordings stay in the portal, behind the same server-side checks as everything else.
  const [broadcasts, products] = await Promise.all([listContent(null, "broadcast"), listContent(null, "product")]);
  const next = upcoming(broadcasts);
  const recordings = broadcasts.filter((b) => !next.includes(b));

  return (
    <div className="space-y-12">
      <SiteTitle title="Media, sessions and walkthroughs." highlight="walkthroughs.">
        Public sessions, recordings and product walkthroughs. Everything here is approved for a public audience.
      </SiteTitle>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section data-reveal aria-labelledby="sessions-title" className="bg-card shadow-card rounded-2xl border p-6 sm:p-7">
            <h2 id="sessions-title" className="text-[20px] leading-[28px] tracking-[-0.02em]">Sessions and recordings</h2>
            {broadcasts.length ? (
              <ul className="mt-4 divide-y">
                {[...next, ...recordings].map((b) => {
                  const live = next.includes(b);
                  return (
                    <li key={b.id} className="flex items-center gap-4 py-4">
                      <span className={live ? "bg-brand-soft text-primary grid size-12 shrink-0 place-items-center rounded-xl" : "bg-navy text-brand grid size-12 shrink-0 place-items-center rounded-xl"}>
                        {live ? <CalendarClock aria-hidden className="size-5" /> : <PlayCircle aria-hidden className="size-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-6 font-medium">{sessionTitle(b.title)}</p>
                        <p className="text-muted-foreground text-[13px] leading-5">{b.summary}</p>
                        <p className="text-muted-foreground mt-1 text-[12px] tabular-nums">
                          {live ? "Upcoming" : "Recording"}{b.starts_at ? ` · ${dateTime(b.starts_at)}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-3 text-[15px]">No public sessions yet.</p>
            )}
          </section>

          <section data-reveal aria-labelledby="walk-title" className="bg-card shadow-card rounded-2xl border p-6 sm:p-7">
            <h2 id="walk-title" className="text-[20px] leading-[28px] tracking-[-0.02em]">Product walkthroughs</h2>
            <p className="text-muted-foreground mt-1 text-[14px] leading-[22px]">
              Each product page explains what it does. Clients see guided demos on synthetic data after signing in.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {[...products].sort((x, y) => x.title.localeCompare(y.title)).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="group hover:border-foreground/20 hover:bg-muted/50 focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl border p-4 outline-none transition-colors focus-visible:ring-2"
                  >
                    <span className="text-[15px] font-medium">{p.title}</span>
                    <ArrowUpRight aria-hidden className="text-muted-foreground group-hover:text-foreground size-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <section data-reveal aria-labelledby="assets-title" className="bg-card shadow-card rounded-2xl border p-6">
            <h2 id="assets-title" className="text-[17px] leading-6">Brand assets</h2>
            <ul className="mt-4 space-y-3">
              {ASSETS.map((a) => (
                <li key={a.href}>
                  <a
                    href={a.href}
                    download
                    className="hover:bg-muted/60 focus-visible:ring-ring flex items-start gap-3 rounded-xl border p-3.5 outline-none transition-colors focus-visible:ring-2"
                  >
                    <Download aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
                    <span>
                      <span className="block text-[14px] font-medium">{a.label}</span>
                      <span className="text-muted-foreground block text-[12px]">{a.note}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <Note label="who sees what">
            Public media is listed here. Invitation-only client webinars and internal employee broadcasts appear only in the
            portal, to the audiences they were published for.
          </Note>
        </div>
      </div>
    </div>
  );
}

/** Recordings are labelled as such already, so the "Recording:" prefix goes and the first letter is raised. */
function sessionTitle(title: string) {
  const t = title.replace(/^Recording:\s*/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
