"use client";

import { Play, ThumbsDown, ThumbsUp } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Banner } from "@/components/banner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { money, pct } from "@/lib/format";
import { OFFERINGS } from "@/lib/products";
import { cn } from "@/lib/utils";

// SYNTHETIC applicants. Invented businesses and numbers, for the sandbox only.
// 15 months of revenue (Jul 2025 to Sep 2026) so the last quarter can be compared with the same quarter a year earlier.
const MONTHS = ["Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26"];
const L = 100_000; // one lakh rupees

type Applicant = { id: string; name: string; sector: string; season: string; emi: number; revenue: number[] };

const APPLICANTS: Applicant[] = [
  {
    id: "woollens",
    name: "Lakeside Woollens (synthetic)",
    sector: "Winter apparel manufacturer",
    season: "Sells most in Oct to Jan; summer months are quiet",
    emi: 1.8 * L,
    revenue: [6, 6.5, 9, 18, 24, 26, 20, 12, 8, 6.5, 6, 6, 6.4, 7, 9.8].map((n) => n * L),
  },
  {
    id: "drinks",
    name: "Harbour Cold Drinks (synthetic)",
    sector: "Beverage distributor",
    season: "Peaks in Mar to Jun with the heat",
    emi: 2.4 * L,
    revenue: [14, 12, 11, 10, 8, 7.5, 8, 10, 15, 20, 22, 18, 10, 8.5, 8].map((n) => n * L),
  },
  {
    id: "pharmacy",
    name: "Riverside Pharmacy (synthetic)",
    sector: "Neighbourhood pharmacy",
    season: "Steady through the year",
    emi: 1.5 * L,
    revenue: [9.2, 9.4, 9.1, 9.6, 9.5, 9.9, 9.7, 9.3, 9.6, 9.8, 9.9, 9.7, 9.9, 10.1, 9.8].map((n) => n * L),
  },
];

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Debt-service ratio here: existing monthly EMI ÷ average monthly revenue over the window. Deterministic, in the browser. */
function analyse(a: Applicant) {
  const n = a.revenue.length;
  const recent = a.revenue.slice(n - 3);
  const lastYear = a.revenue.slice(n - 15, n - 12);
  const year = a.revenue.slice(n - 12);
  const dsrRecent = a.emi / avg(recent);
  const dsrLastYear = a.emi / avg(lastYear);
  const dsrYear = a.emi / avg(year);
  const yoy = avg(recent) / avg(lastYear) - 1;

  let verdict: string;
  if (yoy < -0.1) {
    verdict = `Revenue in these three months is ${pct(-yoy)} lower than in the same months last year, so the higher ratio isn't just the season. That's the case worth a closer look.`;
  } else if (dsrRecent > dsrYear * 1.25) {
    verdict = `Read on its own, the last three months make this business look stretched (${pct(dsrRecent, 1)} against ${pct(dsrYear, 1)} over the full year). Against the same months last year the ratio is ${dsrRecent <= dsrLastYear ? "no worse" : "only slightly higher"}, and revenue is ${yoy >= 0 ? `up ${pct(yoy)}` : `within ${pct(-yoy)}`}: the dip is the season, not a decline.`;
  } else {
    verdict = "Revenue is steady through the year, so the trailing view and the same-season view agree.";
  }
  return { dsrRecent, dsrLastYear, dsrYear, yoy, verdict, recentAvg: avg(recent), lastYearAvg: avg(lastYear) };
}

export function Playground() {
  const id = useId();
  const [applicantId, setApplicantId] = useState(APPLICANTS[0].id);
  const [result, setResult] = useState<ReturnType<typeof analyse> | null>(null);
  const [rating, setRating] = useState<"useful" | "needs_work" | null>(null);
  const [comment, setComment] = useState("");
  const applicant = APPLICANTS.find((a) => a.id === applicantId)!;
  const max = Math.max(...applicant.revenue);
  const n = applicant.revenue.length;

  const pick = (next: string) => {
    setApplicantId(next);
    setResult(null);
  };

  return (
    <div className="space-y-8">
      <Banner tone="warning" title="Sample data · simulated output · not a credit decision">
        Every applicant and number on this page is invented. The calculation runs in your browser and nothing is saved.
      </Banner>

      <section className="border-t pt-5">
        <h2 className="text-[17px] leading-6 font-medium">1. Offering</h2>
        <div role="radiogroup" aria-label="Offering" className="mt-3 flex flex-wrap gap-1.5">
          {OFFERINGS.map((o) => {
            const on = o.value === "sme-credit-decisioning";
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!on}
                title={on ? undefined : "No sandbox for this offering yet"}
                className={cn(
                  "focus-visible:ring-ring inline-flex h-9 items-center rounded-full px-3.5 text-[13px] outline-none focus-visible:ring-2 disabled:opacity-50",
                  on ? "bg-foreground text-background font-medium" : "bg-card border",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-2 text-[12px]">Only SME Credit Decisioning has a sandbox so far.</p>
      </section>

      <section className="border-t pt-5">
        <h2 className="text-[17px] leading-6 font-medium">2. Applicant</h2>
        <div role="radiogroup" aria-label="Applicant" className="mt-3 grid gap-2 md:grid-cols-3">
          {APPLICANTS.map((a) => {
            const on = a.id === applicantId;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(a.id)}
                className={cn(
                  "focus-visible:ring-ring bg-card rounded-md border p-3 text-left transition-colors duration-150 outline-none focus-visible:ring-2",
                  on ? "border-foreground" : "hover:bg-muted",
                )}
              >
                <p className="text-[14px] font-medium">{a.name}</p>
                <p className="text-muted-foreground text-[13px]">{a.sector}</p>
                <p className="text-muted-foreground mt-1 text-[12px]">{a.season} · EMI {money(a.emi)}/month</p>
              </button>
            );
          })}
        </div>

        <figure className="mt-5">
          <figcaption className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
            <span>Monthly revenue, {MONTHS[0]} to {MONTHS[n - 1]}</span>
            <span className="flex items-center gap-1.5"><span aria-hidden className="bg-primary size-2 rounded-full" /> Last 3 months</span>
            <span className="flex items-center gap-1.5"><span aria-hidden className="bg-foreground/40 size-2 rounded-full" /> Same months last year</span>
          </figcaption>
          <div className="mt-3 flex h-32 items-end gap-1" role="img" aria-label={`Monthly revenue for ${applicant.name}`}>
            {applicant.revenue.map((r, i) => (
              <div key={MONTHS[i]} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${MONTHS[i]}: ${money(r)}`}>
                <div
                  className={cn("rounded-t-[4px]", i >= n - 3 ? "bg-primary" : i < 3 ? "bg-foreground/40" : "bg-muted")}
                  style={{ height: `${Math.max(4, (r / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-1 flex gap-1 text-[10px] tabular-nums">
            {MONTHS.map((m) => <span key={m} className="min-w-0 flex-1 truncate text-center">{m.split(" ")[0]}</span>)}
          </div>
        </figure>

        <Button className="mt-5" onClick={() => setResult(analyse(applicant))}>
          <Play /> Run
        </Button>
      </section>

      {result && (
        <section className="border-t pt-5" aria-live="polite">
          <h2 className="text-[17px] leading-6 font-medium">3. Simulated output</h2>
          <p className="text-muted-foreground mt-0.5 text-[13px]">Debt-service ratio = existing EMI ÷ average monthly revenue in the window</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <Ratio label={`Last 3 months (${MONTHS[n - 3]} to ${MONTHS[n - 1]})`} value={result.dsrRecent} hint={`Avg revenue ${money(result.recentAvg)}`} />
            <Ratio label={`Same months last year (${MONTHS[n - 15]} to ${MONTHS[n - 13]})`} value={result.dsrLastYear} hint={`Avg revenue ${money(result.lastYearAvg)}`} />
            <Ratio label="Full last 12 months" value={result.dsrYear} hint="For reference" />
          </div>
          <p className="mt-4 text-[14px] leading-[22px]">{result.verdict}</p>
          <p className="text-muted-foreground mt-2 text-[12px]">
            Why this matters: a trailing-quarter ratio treats an off-season dip as stress. Comparing with the same season a
            year earlier is the seasonality context clients raised in shared learning.
          </p>
        </section>
      )}

      <form
        className="border-t pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Feedback noted (not stored in this demo)");
          setRating(null);
          setComment("");
        }}
      >
        <h2 className="text-[17px] leading-6 font-medium">Feedback on this prototype</h2>
        <div role="radiogroup" aria-label="Was this useful?" className="mt-3 flex flex-wrap gap-1.5">
          {([["useful", "Useful", ThumbsUp], ["needs_work", "Needs work", ThumbsDown]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              onClick={() => setRating(value)}
              className={cn(
                "focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-2",
                rating === value ? "bg-foreground text-background font-medium" : "bg-card border hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <label htmlFor={`${id}-comment`} className="mt-4 block text-[13px] font-medium">
          Comment <span className="text-muted-foreground font-normal">Optional</span>
        </label>
        <Textarea id={`${id}-comment`} className="mt-1.5" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="What would make this useful for a credit analyst?" />
        <Button type="submit" variant="outline" className="mt-3" disabled={!rating}>Send feedback</Button>
      </form>
    </div>
  );
}

function Ratio({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="border-t pt-3">
      <p className="text-muted-foreground font-mono text-[12px] leading-4">{label}</p>
      <p className="mt-1.5 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] tabular-nums">{pct(value, 1)}</p>
      <p className="text-muted-foreground text-[12px] tabular-nums">{hint}</p>
    </div>
  );
}
