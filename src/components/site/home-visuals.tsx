import { Check, EyeOff, Lock, ShieldCheck, Undo2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { RedactionArtifact } from "@/components/site/redaction-artifact";
import { cn } from "@/lib/utils";

/*
 * Illustrations for the home page, drawn in HTML and SVG from the product's own states (no stock art): they show what
 * the portal does. Motion classes live in globals.css and are off under reduced motion.
 */

type Vars = CSSProperties & Record<`--${string}`, string>;

/** The hero: the redaction artifact, orbited by three cards that name what happens around it. */
export function HeroOrbit() {
  return (
    <div className="relative mx-auto max-w-[520px] lg:px-6 lg:pt-28 lg:pb-14">
      <div className="relative z-10">
        <RedactionArtifact />
      </div>

      {/* Consent, recorded per purpose: tilted, upper left. */}
      <div
        className="float-card bg-card text-foreground shadow-lift absolute top-2 -left-12 z-20 hidden w-[200px] rounded-2xl border p-3.5 lg:block"
        style={{ "--tilt": "-6deg", "--float-duration": "7s" } as Vars}
        aria-hidden
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold"><ShieldCheck className="text-primary size-3.5" /> Consent, per purpose</p>
        <ul className="mt-2.5 space-y-1.5">
          {[["Publish a copy", true], ["Name the organisation", false], ["Model training", false]].map(([label, on]) => (
            <li key={label as string} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <Toggle on={on as boolean} />
            </li>
          ))}
        </ul>
      </div>

      {/* A theme unlocks at three organisations: tilted, lower right. */}
      <div
        className="float-card bg-navy-2 shadow-deep absolute -right-3 -bottom-4 z-20 hidden w-[250px] rounded-2xl border border-white/10 p-3.5 text-white lg:block"
        style={{ "--tilt": "5deg", "--float-duration": "8s", "--float-delay": "-2s" } as Vars}
        aria-hidden
      >
        <div className="flex items-center gap-3 whitespace-nowrap">
          <OrgDots />
          <div>
            <p className="text-[12px] font-semibold">Theme unlocked</p>
            <p className="text-navy-muted text-[10px]">Seasonality · 3 organisations</p>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="bg-brand h-full w-full rounded-full" />
        </div>
      </div>

      {/* AIRA's quote check: a small pill, upper right. */}
      <div
        className="float-card bg-brand text-brand-foreground shadow-lift absolute top-10 -right-2 z-20 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold lg:flex"
        style={{ "--tilt": "4deg", "--float-duration": "6s", "--float-delay": "-1s" } as Vars}
        aria-hidden
      >
        <Check className="size-3.5" strokeWidth={3} /> Quote verified against source
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={cn("relative inline-block h-3.5 w-6 shrink-0 rounded-full", on ? "bg-brand-strong" : "bg-muted-foreground/25")}>
      <span className={cn("absolute top-0.5 size-2.5 rounded-full bg-white shadow-sm", on ? "right-0.5" : "left-0.5")} />
    </span>
  );
}

/** Three organisations as overlapping initials. */
function OrgDots({ size = "size-7" }: { size?: string }) {
  return (
    <span className="flex -space-x-1.5">
      {[["M", "bg-brand text-brand-foreground"], ["K", "bg-white text-navy"], ["H", "bg-brand-strong text-brand-foreground"]].map(([l, c]) => (
        <span key={l} className={cn("grid place-items-center rounded-full text-[11px] font-semibold ring-2 ring-navy-2", size, c)}>{l}</span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------- how sharing works

type Step = { title: string; body: string; art: ReactNode };

/** Four steps, each with a small illustration of that state, joined by flowing connectors on wide screens. */
export function FlowSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
      {steps.map((s, i) => (
        <li key={s.title} className="relative" data-reveal style={{ "--reveal-delay": `${i * 70}ms` } as Vars}>
          <div className="bg-card shadow-card lift flex h-full flex-col rounded-2xl border p-4">
            <div className="bg-muted/70 relative h-[150px] overflow-hidden rounded-xl border p-3.5">{s.art}</div>
            <div className="px-1.5 pt-4 pb-1.5">
              <p className="text-primary text-[12px] font-semibold tabular-nums">Step {i + 1}</p>
              <h3 className="mt-1 text-[17px] leading-6 tracking-[-0.01em]">{s.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-[14px] leading-[22px]">{s.body}</p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <svg aria-hidden viewBox="0 0 44 24" className="dash-flow text-brand-strong absolute top-[66px] -right-[42px] z-10 hidden h-6 w-11 lg:block">
              <path d="M2 18 C 14 2, 30 2, 42 12" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
            </svg>
          )}
        </li>
      ))}
    </ol>
  );
}

const line = (w: string, tone = "bg-foreground/15") => <span className={cn("block h-1.5 rounded-full", tone, w)} />;

export const FLOW_ART = {
  draft: (
    <div className="bg-card h-full rounded-lg border p-3 shadow-sm">
      <div className="flex items-center justify-between">
        {line("w-20", "bg-foreground/25")}
        <span className="bg-navy text-brand inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          <Lock className="size-2.5" /> Private
        </span>
      </div>
      <div className="mt-3.5 space-y-2">{line("w-full")}{line("w-11/12")}{line("w-2/3")}</div>
      <p className="text-muted-foreground mt-3 text-[10px]">Saved · only you can see it</p>
    </div>
  ),
  consent: (
    <div className="bg-card h-full space-y-2.5 rounded-lg border p-3 shadow-sm">
      {[["Publish a reviewed copy", true], ["Show organisation name", false], ["Use for model training", false]].map(([l, on]) => (
        <div key={l as string} className="flex items-center justify-between gap-2">
          <span className="text-[11px]">{l}</span>
          <Toggle on={on as boolean} />
        </div>
      ))}
      <p className="text-muted-foreground border-t pt-2 text-[10px]">Each choice recorded with a date</p>
    </div>
  ),
  review: (
    <div className="bg-card h-full rounded-lg border p-3 shadow-sm">
      <p className="text-[11px] leading-4">…blanks for one cycle. Contact</p>
      <p className="mt-1">
        <span className="bg-warning-soft text-warning rounded px-1 text-[11px] line-through">desk@bank.example</span>
      </p>
      <p className="mt-1 text-[11px]">
        or account <span className="bg-warning-soft text-warning rounded px-1 tabular-nums line-through">0045 1233 9871</span>
      </p>
      <p className="bg-success-soft text-success mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
        <EyeOff className="size-3" /> 2 identifiers removed
      </p>
    </div>
  ),
  theme: (
    <div className="bg-navy h-full rounded-lg p-3 text-white">
      <div className="flex items-center justify-between">
        <OrgDots size="size-8" />
        <span className="text-brand text-[22px] leading-none font-semibold tabular-nums">3</span>
      </div>
      <p className="mt-3 text-[11px] font-semibold">Seasonality context</p>
      <p className="text-navy-muted text-[10px]">Distinct organisations, not posts</p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="bg-brand h-full w-full rounded-full" />
      </div>
    </div>
  ),
};

/** Withdrawal, the promise that closes the flow: one wide strip under the steps. */
export function WithdrawStrip({ title, body }: { title: string; body: string }) {
  return (
    <div data-reveal className="bg-navy mt-6 flex flex-col gap-4 rounded-2xl p-5 text-white sm:flex-row sm:items-center sm:gap-5 sm:p-6">
      <span className="bg-brand text-brand-foreground grid size-11 shrink-0 place-items-center rounded-xl">
        <Undo2 aria-hidden className="size-5" />
      </span>
      <div className="flex-1">
        <h3 className="text-[17px] leading-6">{title}</h3>
        <p className="text-navy-muted mt-0.5 text-[14px] leading-[22px]">{body}</p>
      </div>
      <span className="text-brand inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium">
        <Check className="size-4" strokeWidth={2.5} /> One database transaction
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- AIRA

/** The quote beside the copy it came from, with the matched sentence highlighted: verification shown, not claimed. */
export function AiraProof() {
  return (
    <div className="relative grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
      <blockquote data-reveal className="bg-card shadow-card border-l-brand-strong rounded-r-2xl border border-l-4 px-7 py-6">
        <p className="text-muted-foreground text-[12px] font-semibold">AIRA summary · Seasonality context</p>
        <p className="mt-3 text-[22px] leading-[31px] tracking-[-0.015em]">
          “Debt-service ratios computed on trailing three months look alarming in August.”
        </p>
        <footer className="text-primary mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium">
          <Check className="size-4" strokeWidth={2.5} aria-hidden /> Quote verified against its source
        </footer>
      </blockquote>
      {/* The check, drawn: the quote flows into the sentence it was matched against. */}
      <svg aria-hidden viewBox="0 0 44 24" className="dash-flow text-brand-strong absolute top-1/2 left-1/2 z-10 hidden h-6 w-11 -translate-x-1/2 -translate-y-1/2 lg:block">
        <path d="M2 12 H 42" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
      </svg>
      <figure data-reveal style={{ "--reveal-delay": "120ms" } as Vars} className="bg-muted/70 relative rounded-2xl border p-5">
        <figcaption className="text-muted-foreground flex items-center justify-between text-[12px]">
          <span className="font-semibold">Source: shared copy</span>
          <span>Market observation · Jun-Sep 2026</span>
        </figcaption>
        <p className="mt-3 text-[15px] leading-[25px]">
          For small manufacturers in our book, June to September collections fall sharply and recover after the festive
          season.{" "}
          <mark className="bg-brand-soft text-foreground decoration-brand-strong rounded px-1 underline decoration-2 underline-offset-4">
            Debt-service ratios computed on trailing three months look alarming in August.
          </mark>
        </p>
        <p className="text-success bg-success-soft mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold">
          <Check className="size-3.5" strokeWidth={3} aria-hidden /> Exact match · checked before the summary is saved
        </p>
      </figure>
    </div>
  );
}
