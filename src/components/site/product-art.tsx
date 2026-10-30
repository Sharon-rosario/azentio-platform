import { Check, Flag } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * A small illustration per product, drawn from what the product does (no screenshots of products we don't ship).
 * Navy panels with brand-coloured detail, so every card reads as one family.
 */

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div aria-hidden className={cn("bg-navy relative h-[132px] overflow-hidden rounded-xl p-4 text-white", className)}>{children}</div>;
}

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
          {s === "ok" ? (
            <span className="bg-brand text-brand-foreground grid size-4 place-items-center rounded-full"><Check className="size-2.5" strokeWidth={3} /></span>
          ) : (
            <span className="grid size-4 place-items-center rounded-full bg-amber-300 text-amber-900"><Flag className="size-2.5" strokeWidth={3} /></span>
          )}
          <span className="text-[11px]">{l}</span>
        </div>
      ))}
    </Panel>
  );
}

/** Comparable segments: a cluster of similar cases picked out of a portfolio. */
function Portfolio() {
  const dots = [[30, 30], [70, 72], [105, 40], [150, 18], [175, 80], [250, 22], [300, 75], [330, 30], [370, 60], [52, 52], [280, 48], [125, 85]];
  const cluster = [[205, 48], [222, 56], [214, 38], [236, 44], [196, 60], [228, 66]];
  return (
    <Panel>
      <svg viewBox="0 0 400 100" className="absolute inset-x-4 top-4 h-[100px] w-[calc(100%-32px)]">
        {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="rgb(255 255 255 / 0.3)" />)}
        <ellipse cx="216" cy="52" rx="38" ry="28" fill="rgb(85 255 190 / 0.12)" stroke="#55ffbe" strokeWidth="1.2" strokeDasharray="4 3" />
        {cluster.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill="#55ffbe" />)}
      </svg>
      <span className="bg-brand text-brand-foreground absolute right-3 bottom-3 rounded-full px-2 py-0.5 text-[10px] font-semibold">6 comparable</span>
    </Panel>
  );
}

/** Report fields mapped to a regulator's template, validated before filing. */
function Riva() {
  const left = ["ledger.npa_amt", "ledger.prov_cov", "core.sector"];
  const right = ["Field 14.2", "Field 21.1", "Field 14.3"];
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
            <Check className="text-brand size-3" strokeWidth={3} /> {r}
          </span>
        ))}
      </div>
    </Panel>
  );
}

const ART: Record<string, () => React.ReactElement> = {
  "credit-strategy-simulator": Simulator,
  "sme-credit-decisioning": Workbench,
  "similar-portfolio-intelligence": Portfolio,
  riva: Riva,
};

export function ProductArt({ slug }: { slug: string | null }) {
  const Art = slug ? ART[slug] : undefined;
  return Art ? <Art /> : null;
}
