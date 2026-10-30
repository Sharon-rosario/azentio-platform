import { ArrowRight, FlaskConical, Lightbulb, Radio, ShieldCheck, Sparkles } from "lucide-react";
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
import { listIdeas, listThemes } from "@/server/insights";
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
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${p.name.split(" ")[0]}`}
        description={`${p.orgName} · ${p.roles.map((r) => ROLE_LABEL[r]).join(", ")}`}
        actions={client ? <Button render={<Link href="/portal/observations/new" />}><Sparkles /> Share an observation</Button> : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {client ? (
          <>
            <StatTile label="My drafts" value={count("draft") + count("returned")} hint={count("returned") ? `${count("returned")} need a change` : "Private until you share"} />
            <StatTile label="In review" value={count("submitted")} hint="With a learning moderator" />
            <StatTile label="Published" value={count("published")} hint="De-identified, in shared learning" />
            <StatTile label="Themes" value={themes.filter((t) => !t.suppressed).length} hint="With 3+ organisations behind them" />
          </>
        ) : (
          <>
            {queue && <StatTile label="Waiting for moderation" value={queue.items.length} hint={`${queue.reports.length} reports open`} />}
            <StatTile label="Themes" value={themes.filter((t) => !t.suppressed).length} hint="Ready for product teams" />
            <StatTile label="Improvement ideas" value={ideas.length} hint={`${ideas.filter((i) => i.status === "Under review").length} under review`} />
            <StatTile label="Internal experiments" value={experiments.length} hint="Employees only" />
          </>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {client ? (
          <Panel title="Your demos" description={`Products ${p.orgName} is entitled to, on synthetic data`}>
            {demos.length ? (
              <ul className="space-y-2">
                {demos.map((d) => (
                  <li key={d.id} className="bg-muted rounded-[12px] p-3">
                    <p className="text-[14px] font-medium">{d.title}</p>
                    <p className="text-muted-foreground text-[13px]">{d.summary}</p>
                    {d.product && <p className="text-muted-foreground mt-1 text-[12px]">{PRODUCT_NAME[d.product] ?? d.product}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No demos yet" description="Your organisation has no product entitlements assigned." />
            )}
          </Panel>
        ) : (
          <Panel title="Internal experiments" description="Prototypes and notes. Not product commitments">
            <ul className="space-y-2">
              {experiments.map((d) => (
                <li key={d.id} className="bg-muted flex gap-3 rounded-[12px] p-3">
                  <FlaskConical className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-[14px] font-medium">{d.title}</p>
                    <p className="text-muted-foreground text-[13px]">{d.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-3" render={<Link href="/portal/playground" />}>
              Open the playground <ArrowRight />
            </Button>
          </Panel>
        )}

        <Panel title="Sessions" description={client ? "Invitation-only client sessions" : "Employee broadcasts and recordings"}
          action={<Button variant="ghost" size="sm" render={<Link href="/portal/live" />}>All <ArrowRight /></Button>}>
          {sessions.length ? (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-start gap-3 text-[14px]">
                  <Radio className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-muted-foreground text-[13px]">{s.starts_at ? date(s.starts_at) : ""} · {s.summary}</p>
                  </div>
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
            <ul className="divide-y">
              {ideas.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <Lightbulb className="text-muted-foreground size-4 shrink-0" />
                    <span className="truncate">{i.title}</span>
                  </span>
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
            <p className="flex items-center gap-2 text-[14px]">
              <ShieldCheck className="text-primary size-4" /> {queue.items.length} waiting, {queue.reports.length} reports open
            </p>
            <Button className="mt-3" render={<Link href="/portal/moderation" />}>Review <ArrowRight /></Button>
          </Panel>
        )}
      </div>
    </div>
  );
}
