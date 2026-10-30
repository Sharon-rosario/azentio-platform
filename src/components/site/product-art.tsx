import { ArrowRight, Check, FileText, Flag, Lock, UserCheck } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Home-page cards for the products and solutions, each with a small illustration drawn from what it does (no
 * screenshots of products we don't ship). Navy panels with brand-coloured detail, so all eight read as one family.
 */

type Vars = CSSProperties & Record<`--${string}`, string>;

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div aria-hidden className={cn("bg-navy relative h-[132px] overflow-hidden rounded-xl p-4 text-white", className)}>{children}</div>;
}

const tick = (
  <span className="bg-brand text-brand-foreground grid size-4 shrink-0 place-items-center rounded-full">
    <Check className="size-2.5" strokeWidth={3} />
  </span>
);

// ---------------------------------------------------------------- products

/** Cut-off sliders and the approval rate they move. */
function Simulator() {
  return (
    <Panel className="flex items-end justify-between gap-4">
      <div className="w-1/2 space-y-3 self-center">
        {[["Score cut-off", "58%"], ["Max DSR", "36%"]].map(([l, at]) => (
          <div key={l}>
            <p className="text-navy-muted text-[10px]">{l}</p>
            <div className="relative mt-1.5 h-1.5 rounded-full bg-white/15">
              <div className="bg-brand absolute inset-y-0 left-0 rounded-full" style={{ width: at }} />
              <span className="bg-brand absolute top-1/2 size-3 -translate-y-1/2 rounded-full ring-2 ring-white" style={{ left: `calc(${at} - 6px)` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex h-full items-end gap-1.5">
        {[38, 52, 46, 64, 78].map((h, i) => (
          <span key={i} className={cn("w-3 rounded-t", i === 4 ? "bg-brand" : "bg-white/25")} style={{ height: `${h}%` }} />
        ))}
      </div>
    </Panel>
  );
}

/** A policy checklist where every outcome names its rule. */
function Workbench() {
  const rows: [string, "ok" | "flag"][] = [["Cash-flow coverage", "ok"], ["Collateral valuation", "ok"], ["Rule 4.2 · sector cap", "flag"]];
  return (
    <Panel className="space-y-2">
      {rows.map(([l, s]) => (
        <div key={l} className="flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-1.5">
          {s === "ok" ? tick : (
            <span className="grid size-4 place-items-center rounded-full bg-amber-300 text-amber-900"><Flag className="size-2.5" strokeWidth={3} /></span>
          )}
          <span className="text-[11px]">{l}</span>
        </div>
      ))}
    </Panel>
  );
}

/** One application matched against the portfolio segments most like it. */
function Portfolio() {
  const segments = [["Segment A", "92%"], ["Segment B", "81%"], ["Segment C", "67%"]];
  return (
    <Panel className="space-y-1.5 py-3">
      <p className="flex items-center justify-between text-[10px]">
        <span className="bg-brand text-brand-foreground rounded-full px-2 py-0.5 font-semibold">Your application</span>
        <span className="text-navy-muted">most similar</span>
      </p>
      {segments.map(([l, m], i) => (
        <div key={l} className="flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-1 leading-4">
          <span className="w-[62px] shrink-0 text-[11px] whitespace-nowrap">{l}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <span className={cn("block h-full rounded-full", i === 0 ? "bg-brand" : "bg-brand/50")} style={{ width: m }} />
          </span>
          <span className="w-7 text-right text-[10px] tabular-nums">{m}</span>
        </div>
      ))}
    </Panel>
  );
}

/** Report fields mapped to a regulator's template, validated before filing. */
function Riva() {
  const left = ["npa_amt", "prov_cov", "sector"];
  const right = ["14.2", "21.1", "14.3"];
  return (
    <Panel className="flex items-center justify-between gap-2">
      <div className="shrink-0 space-y-2">
        {left.map((l) => <span key={l} className="block rounded-md bg-white/10 px-2 py-1 font-mono text-[10px]">{l}</span>)}
      </div>
      {/* Fields cross over on their way to the template: a mapping, not a copy. */}
      <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="h-[84px] min-w-8 flex-1">
        {[[13, 13], [40, 67], [67, 40]].map(([a, b]) => (
          <path key={a} d={`M0 ${a} C 50 ${a}, 50 ${b}, 100 ${b}`} stroke="#2ed88e" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="shrink-0 space-y-2">
        {right.map((r) => (
          <span key={r} className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px]">
            <Check className="text-brand size-3" strokeWidth={3} /> Field {r}
          </span>
        ))}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- solutions

/** A risk gauge that stops at "refer": the model recommends, an officer decides. */
function Decisioning() {
  return (
    <Panel className="flex items-center gap-4">
      <svg viewBox="0 0 120 70" className="h-[76px] w-[120px] shrink-0">
        <path d="M10 62 A 50 50 0 0 1 110 62" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="10" strokeLinecap="round" />
        <path d="M10 62 A 50 50 0 0 1 80 18" fill="none" stroke="#55ffbe" strokeWidth="10" strokeLinecap="round" />
        <line x1="60" y1="62" x2="86" y2="26" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="62" r="5" fill="white" />
      </svg>
      <div className="min-w-0 space-y-1.5">
        <p className="rounded-full bg-amber-300 px-2 py-0.5 text-center text-[10px] font-semibold text-amber-900">Refer</p>
        <p className="flex items-center gap-1 text-[10px]"><UserCheck className="text-brand size-3 shrink-0" /> Officer decides</p>
        <p className="text-navy-muted text-[10px]">3 reasons cited</p>
      </div>
    </Panel>
  );
}

/** A statement read into fields a reviewer can check. */
function Documents() {
  return (
    <Panel className="flex items-center gap-3">
      <div className="relative h-full w-[64px] shrink-0 rounded-md bg-white p-2">
        <FileText className="text-navy size-3.5" />
        <div className="mt-1.5 space-y-1">
          {["w-full", "w-4/5", "w-full", "w-3/5", "w-4/5"].map((w, i) => (
            <span key={i} className={cn("block h-1 rounded-full", i === 2 ? "bg-brand-strong" : "bg-navy/20", w)} />
          ))}
        </div>
      </div>
      <ArrowRight className="text-brand size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        {["Net income", "Employer", "Statement period"].map((f) => (
          <p key={f} className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px]">
            <Check className="text-brand size-3 shrink-0" strokeWidth={3} /> <span className="truncate">{f}</span>
          </p>
        ))}
      </div>
    </Panel>
  );
}

/** An agent drafts, a person reviews, then it's filed: automation with a human in the loop. */
function Agents() {
  const nodes = [["Agent", "drafts"], ["Analyst", "reviews"], ["Filed", "with audit"]];
  return (
    <Panel className="flex items-center justify-between">
      {nodes.map(([t, s], i) => (
        <div key={t} className="flex items-center">
          <div className={cn("w-[64px] rounded-lg px-2 py-2 text-center", i === 1 ? "bg-brand text-brand-foreground" : "bg-white/10")}>
            <p className="text-[11px] font-semibold">{t}</p>
            <p className={cn("text-[9px]", i === 1 ? "" : "text-navy-muted")}>{s}</p>
          </div>
          {i < nodes.length - 1 && (
            <svg viewBox="0 0 20 8" className="dash-flow text-brand mx-0.5 h-2 w-4">
              <path d="M0 4 H 20" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            </svg>
          )}
        </div>
      ))}
    </Panel>
  );
}

/** Every request checked on the server, and every decision written to the audit log. */
function TrustedAi() {
  const log = [["role", "ok"], ["tenant", "ok"], ["audit", "sealed"]];
  return (
    <Panel className="flex items-center gap-4">
      <span className="bg-brand text-brand-foreground grid size-12 shrink-0 place-items-center rounded-xl">
        <Lock className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5 font-mono text-[10px]">
        {log.map(([k, v]) => (
          <p key={k} className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-2 py-1">
            <span className="text-navy-muted">{k}</span>
            <span className="text-brand">{v}</span>
          </p>
        ))}
      </div>
    </Panel>
  );
}

const ART: Record<string, () => ReactElement> = {
  "credit-strategy-simulator": Simulator,
  "sme-credit-decisioning": Workbench,
  "similar-portfolio-intelligence": Portfolio,
  riva: Riva,
  "intelligent-decisioning": Decisioning,
  "document-intelligence": Documents,
  "ai-agents-automation": Agents,
  "trusted-enterprise-ai": TrustedAi,
};

/** One offering's drawing by slug (nothing when it has none). */
export function OfferingArt({ slug }: { slug: string }) {
  const Art = ART[slug];
  return Art ? <Art /> : null;
}

export type Offering = { slug: string; href: string; kind: "Product" | "Solution"; title: string; summary: string };

/** Four across on wide screens, two on tablets, one on phones; each card revealed in turn. */
export function OfferingGrid({ items }: { items: Offering[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((o, i) => {
        const Art = ART[o.slug];
        return (
          <li key={o.href} data-reveal style={{ "--reveal-delay": `${(i % 4) * 60}ms` } as Vars}>
            <Link
              href={o.href}
              className="group bg-card shadow-card lift focus-visible:ring-ring flex h-full flex-col rounded-2xl border p-4 outline-none focus-visible:ring-2"
            >
              {Art && <Art />}
              <span className="text-muted-foreground mt-5 px-1 text-[12px] font-medium">{o.kind}</span>
              <span className="mt-0.5 px-1 text-[18px] leading-6 font-semibold tracking-[-0.02em]">{o.title}</span>
              <span className="text-muted-foreground mt-2 flex-1 px-1 text-[14px] leading-[22px]">{o.summary}</span>
              <span className="text-primary mt-5 inline-flex items-center gap-1.5 px-1 pb-1 text-[14px] font-medium">
                {o.kind === "Product" ? "Explore the product" : "See how it works"}
                <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
