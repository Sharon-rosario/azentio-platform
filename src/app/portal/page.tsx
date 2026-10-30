import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatTile } from "@/components/stats";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/products";
import { date } from "@/lib/format";
import { getPrincipal } from "@/server/auth";
import { listContent } from "@/server/content";
import { listIdeas, listThemes, MIN_ORGS } from "@/server/insights";
import { listObservations, moderationQueue } from "@/server/learning";
import { can, ROLE_LABEL } from "@/server/policy";

export const metadata: Metadata = { title: "Home" };

export default async function PortalHome() {
  const p = (await getPrincipal())!;
  if (!p.membershipId) {
    return (
      <Panel>
        <EmptyState
          title="You're signed in, but not part of an organisation yet"
          description="Clients join through an invitation from their organisation's administrator. Ask them to invite this email address."
        />
      </Panel>
    );
  }
  const client = p.orgKind === "client";
  // One after another, not in parallel: with themes fanning out too, parallel loads put more queries in flight than
  // the pool has connections, which hung requests behind Supabase's transaction pooler on production.
  const content = await listContent(p);
  const ideas = can(p, "ideas.read") ? await listIdeas(p) : [];
  const themes = can(p, "themes.read") ? await listThemes(p) : [];
  const mine = can(p, "observations.write") ? await listObservations(p, "mine") : [];
  const queue = can(p, "moderation.review") ? await moderationQueue(p) : null;
  const demos = content.filter((c) => c.kind === "demo");
  const sessions = content.filter((c) => c.kind === "broadcast" && c.audience !== "public");
  const experiments = content.filter((c) => c.kind === "experiment");
  const count = (s: string) => mine.filter((o) => o.status === s).length;

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Welcome, ${p.name.split(" ")[0]}`}
        description={`${p.orgName} · ${p.roles.map((r) => ROLE_LABEL[r]).join(", ")}`}
        actions={client ? <Button render={<Link href="/portal/observations/new" />}><Sparkles /> Share an observation</Button> : undefined}
      />

      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
        {client ? (
          <>
            <StatTile href="/portal/observations" label="My drafts" value={count("draft") + count("returned")} hint={count("returned") ? `${count("returned")} need a change` : "Private until you share"} />
            <StatTile href="/portal/observations" label="In review" value={count("submitted")} hint="With a learning moderator" />
            <StatTile href="/portal/shared" label="Published" value={count("published")} hint="De-identified, in shared learning" />
            <StatTile href="/portal/themes" label="Themes" value={themes.filter((t) => !t.suppressed).length} hint={`With ${MIN_ORGS}+ organisations behind them`} />
          </>
        ) : (
          <>
            {queue && <StatTile href="/portal/moderation" label="Waiting for moderation" value={queue.items.length} hint={`${queue.reports.length} reports open`} />}
            <StatTile href="/portal/themes" label="Themes" value={themes.filter((t) => !t.suppressed).length} hint="Ready for product teams" />
            <StatTile href="/portal/ideas" label="Improvement ideas" value={ideas.length} hint={`${ideas.filter((i) => i.status === "Under review").length} under review`} />
            <StatTile href="/portal/playground" label="Internal experiments" value={experiments.length} hint="Employees only" />
          </>
        )}
      </div>

      <div className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
        {client ? (
          <Panel title="Your demos" description={`Products ${p.orgName} is entitled to, on synthetic data`}>
            {demos.length ? (
              <ul className="-my-3.5 divide-y">
                {demos.map((d) => (
                  <li key={d.id} className="py-3.5">
                    {d.product && <p className="text-muted-foreground font-mono text-[12px] leading-4">{PRODUCT_NAME[d.product] ?? d.product}</p>}
                    <p className="mt-1 text-[15px] leading-6 font-medium">{d.title}</p>
                    <p className="text-muted-foreground text-[14px] leading-5">{d.summary}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No demos yet" description="Your organisation has no product entitlements assigned." />
            )}
          </Panel>
        ) : (
          <Panel title="Internal experiments" description="Prototypes and notes. Not product commitments">
            {!experiments.length && <p className="text-muted-foreground text-[14px] leading-5">No experiments are posted yet.</p>}
            <ul className="-my-3.5 divide-y">
              {experiments.map((d) => (
                <li key={d.id} className="py-3.5">
                  <p className="text-[15px] leading-6 font-medium">{d.title}</p>
                  <p className="text-muted-foreground text-[14px] leading-5">{d.summary}</p>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 self-start" render={<Link href="/portal/playground" />}>
              Open the playground <ArrowRight />
            </Button>
          </Panel>
        )}

        <Panel title="Sessions" description={client ? "Invitation-only client sessions" : "Employee broadcasts and recordings"}
          action={<Button variant="ghost" size="sm" render={<Link href="/portal/live" />}>All <ArrowRight /></Button>}>
          {sessions.length ? (
            <ul className="-my-3.5 divide-y">
              {sessions.map((s) => (
                <li key={s.id} className="py-3.5">
                  {s.starts_at && <p className="text-muted-foreground font-mono text-[12px] leading-4 tabular-nums">{date(s.starts_at)}</p>}
                  <p className="mt-1 text-[15px] leading-6 font-medium">{s.title}</p>
                  <p className="text-muted-foreground text-[14px] leading-5">{s.summary}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No sessions scheduled" />
          )}
        </Panel>

        <Panel title="Improvements" description={client ? "What's happening with ideas from shared learning" : "Linked to approved themes"}
          action={<Button variant="ghost" size="sm" render={<Link href="/portal/ideas" />}>All <ArrowRight /></Button>}>
          {ideas.length ? (
            <ul className="-my-3.5 divide-y">
              {ideas.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3.5 text-[15px] leading-6">
                  <span className="min-w-0 truncate">{i.title}</span>
                  <StatusBadge value={i.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No improvement ideas yet" />
          )}
        </Panel>

        {queue && (
          <Panel title="Moderation" description="Proposed contributions and reports">
            <p className="text-[15px] leading-6">
              {queue.items.length} waiting, {queue.reports.length} reports open
            </p>
            <Button className="mt-4 self-start" render={<Link href="/portal/moderation" />}>Review <ArrowRight /></Button>
          </Panel>
        )}
      </div>
    </div>
  );
}
