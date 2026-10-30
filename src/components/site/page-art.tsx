import { Check, ShieldCheck, X } from "lucide-react";
import type { CSSProperties } from "react";

import { OfferingArt } from "@/components/site/product-art";
import { cn } from "@/lib/utils";

/*
 * Illustrations for the inner pages' title bands: a framed, gently floating card, as in the home hero. Drawn from what
 * the code does; motion classes live in globals.css and are off under reduced motion.
 */

type Vars = CSSProperties & Record<`--${string}`, string>;

/** A product's own drawing, framed and enlarged for its page. */
export function ProductHeroArt({ slug }: { slug: string }) {
  return (
    <div
      aria-hidden
      className="float-card bg-card shadow-deep mx-auto w-full max-w-[460px] rounded-2xl border p-3 lg:mr-0"
      style={{ "--tilt": "-2deg", "--float-duration": "8s" } as Vars}
    >
      <div className="[zoom:1.45] max-sm:[zoom:1]">
        <OfferingArt slug={slug} />
      </div>
    </div>
  );
}

/** What `authorize()` does to one request: three checks pass, the other organisation's record answers 404. */
export function AccessCheckArt() {
  const checks: [string, string, boolean][] = [
    ["session", "valid, reloaded this request", true],
    ["role", "client member: may read", true],
    ["audience", "entitled to the product", true],
    ["tenant", "another organisation's record", false],
  ];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[460px] lg:mr-0">
      <div className="float-card bg-card shadow-deep rounded-2xl border p-5" style={{ "--tilt": "-1.5deg", "--float-duration": "8s" } as Vars}>
        <p className="text-muted-foreground font-mono text-[12px]">GET /api/observations/12</p>
        <ul className="mt-4 space-y-2">
          {checks.map(([k, v, ok]) => (
            <li key={k} className={cn("flex items-center gap-3 rounded-lg px-3 py-2", ok ? "bg-muted/70" : "bg-warning-soft")}>
              <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", ok ? "bg-brand text-brand-foreground" : "bg-warning text-white")}>
                {ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
              </span>
              <span className="w-[70px] shrink-0 font-mono text-[12px] font-medium">{k}</span>
              <span className="text-muted-foreground min-w-0 truncate text-[12px]">{v}</span>
            </li>
          ))}
        </ul>
        <p className="bg-navy text-brand mt-4 flex items-center justify-between rounded-lg px-3 py-2 font-mono text-[13px]">
          <span>404 Not found</span>
          <span className="text-navy-muted text-[11px]">same as a record that doesn&apos;t exist</span>
        </p>
      </div>
      <div
        className="float-card bg-brand text-brand-foreground shadow-lift absolute -top-4 -right-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
        style={{ "--tilt": "4deg", "--float-duration": "6s", "--float-delay": "-1s" } as Vars}
      >
        <ShieldCheck className="size-3.5" /> Deny by default
      </div>
    </div>
  );
}
