import { ArrowRight, Flag, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Autopilot } from "@/components/learning/autopilot";
import { ReportDecision } from "@/components/learning/report-actions";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { TONES } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { date, dateTime } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { cn } from "@/lib/utils";
import { DEMO_MODE, getPrincipal } from "@/server/auth";
import { moderationQueue } from "@/server/learning";
import { isForbidden, load } from "@/server/page";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Moderation" };

export default async function ModerationPage() {
  const q = await load((p) => moderationQueue(p), "/portal/moderation");
  if (isForbidden(q)) return <Forbidden message={q.forbidden} />;
  const p = (await getPrincipal())!;
  const canDecide = can(p, "reports.decide");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation"
        description="Only contributions proposed for the learning community reach this queue. Private and organisation-only drafts never do."
      />

      <Autopilot demo={DEMO_MODE} queued={q.items.length} />

      <Panel
        title="Waiting for review"
        description={`${q.items.length} ${q.items.length === 1 ? "contribution" : "contributions"}, oldest first`}
      >
        {q.items.length ? (
          <ul className="border-t">
            {q.items.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground font-mono text-[12px] leading-4">{o.org}</p>
                  <p className="mt-1 text-[16px] leading-6 font-medium">{o.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-[14px] leading-5">
                    {o.category} · {PRODUCT_NAME[o.offering] ?? o.offering} · Submitted{" "}
                    <span className="tabular-nums">{date(o.updated_at)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {o.flags.length > 0 && (
                    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium", TONES.warning)}>
                      <TriangleAlert className="size-3.5" />
                      <span className="tabular-nums">{o.flags.length}</span> possible sensitive {o.flags.length === 1 ? "match" : "matches"}
                    </span>
                  )}
                  <Button variant="outline" size="sm" render={<Link href={`/portal/moderation/${o.id}`} />}>
                    Review <ArrowRight />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={ShieldCheck} title="Nothing waiting for review" description="New contributions appear here when a client submits one for community sharing." />
        )}
      </Panel>

      <Panel
        title="Open reports"
        description="Reported copies are hidden from shared learning until you restore or remove them"
      >
        {q.reports.length ? (
          <ul className="divide-y">
            {q.reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="flex min-w-0 flex-1 gap-3">
                  <Flag className="text-warning mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">{r.title}</p>
                    <p className="mt-0.5 text-[13px]">&ldquo;{r.reason}&rdquo;</p>
                    <p className="text-muted-foreground mt-0.5 text-[12px] tabular-nums">Reported {dateTime(r.created_at)}</p>
                  </div>
                </div>
                {canDecide && <ReportDecision reportId={r.id} title={r.title} />}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No open reports" description="When a client reports a shared copy, it's listed here." />
        )}
      </Panel>
    </div>
  );
}
