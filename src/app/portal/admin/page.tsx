import { Building2, ScrollText, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Banner } from "@/components/banner";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatTile } from "@/components/stats";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { auditPage, organisations, verifyAudit } from "@/server/members";
import { isForbidden, load } from "@/server/page";

export const metadata: Metadata = { title: "Admin" };

const MAX_DETAIL = 120;

/** Audit detail is stored as JSON text; show it compact and cut long ones (full text on hover). */
function compact(detail: string | null) {
  if (!detail) return "";
  let text = detail;
  try {
    text = JSON.stringify(JSON.parse(detail));
  } catch {
    // not JSON: show as stored
  }
  return text === "{}" || text === "null" ? "" : text;
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function AdminPage({ searchParams }: PageProps<"/portal/admin">) {
  const sp = await searchParams;
  const data = await load(async (p) => ({
    audit: await auditPage(p, { area: one(sp.area), page: Number(one(sp.page) ?? 1) }),
    chain: await verifyAudit(p),
    orgs: await organisations(p),
  }), "/portal/admin");
  if (isForbidden(data)) return <Forbidden message={data.forbidden} />;
  const { audit, orgs, chain } = data;
  const log = audit.rows;
  const areaCount = (a: string) => audit.byArea.find((x) => x.area === a)?.n ?? 0;
  const href = (q: { area?: string | null; page?: number }) => {
    const u = new URLSearchParams();
    if (q.area) u.set("area", q.area);
    if (q.page && q.page > 1) u.set("page", String(q.page));
    const qs = u.toString();
    return `/portal/admin${qs ? `?${qs}` : ""}#audit`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Administration" description="Organisations on the portal and the audit log of privileged actions." />
      <Banner tone="info">
        Privileged actions are audited. Administrators can&apos;t read client contributions; that needs moderation rights.
      </Banner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Organisations" value={orgs.length} hint={`${orgs.filter((o) => o.kind === "client").length} client organisations`} />
        <StatTile label="Active members" value={orgs.reduce((n, o) => n + o.members, 0)} hint="Across every organisation" />
        <StatTile label="Audited actions" value={audit.byArea.reduce((n, a) => n + a.n, 0)} hint="Written in the same transaction as the change" />
        <StatTile label="Moderation decisions" value={areaCount("moderation") + areaCount("report")} hint="Publish, return, decline and report outcomes" />
      </div>

      <Panel title="Organisations" description={`${orgs.length} on the portal`}>
        {orgs.length ? (
          <Table>
            <TableHeader>
              <TableRow className="text-[12px] hover:bg-transparent">
                <TableHead className="text-muted-foreground font-normal">Name</TableHead>
                <TableHead className="text-muted-foreground font-normal">Kind</TableHead>
                <TableHead className="text-muted-foreground font-normal">Industry</TableHead>
                <TableHead className="text-muted-foreground font-normal">Region</TableHead>
                <TableHead className="text-muted-foreground text-right font-normal">Active members</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((o) => (
                <TableRow key={o.id} className="text-[14px]">
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-[13px] capitalize">{o.kind}</TableCell>
                  <TableCell className="text-[13px]">{o.industry || "—"}</TableCell>
                  <TableCell className="text-[13px]">{o.region || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.members}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/portal/members?orgId=${o.id}`} className="text-primary text-[13px] outline-none hover:underline focus-visible:underline">
                      Members
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={Building2} title="No organisations yet" />
        )}
      </Panel>

      <Panel
        title={<span id="audit" className="scroll-mt-28">Audit log</span>}
        description={`${audit.total} ${audit.area ? `"${audit.area}" ` : ""}entries, newest first · page ${audit.page} of ${audit.pages}`}
      >
        <p
          role="status"
          className={cn("-mt-1 mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-4 py-3 text-[13px]",
            chain.ok ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft")}
        >
          {chain.ok ? <ShieldCheck aria-hidden className="text-success size-4" /> : <ShieldAlert aria-hidden className="text-danger size-4" />}
          <span className="font-medium">
            {chain.ok ? `Hash chain intact: all ${chain.checked} entries verified` : `Hash chain broken at entry #${chain.brokenAt}`}
          </span>
          <span className="text-muted-foreground">
            Each entry&apos;s SHA-256 covers the one before it, so an edited, removed or inserted entry is detected. Head{" "}
            <code className="font-mono text-[12px]">{chain.head.slice(0, 12)}…</code>
          </span>
        </p>
        <nav aria-label="Filter by area" className="mb-4 flex flex-wrap gap-1.5">
          {[{ area: null as string | null, n: audit.byArea.reduce((n, a) => n + a.n, 0) }, ...audit.byArea].map((a) => {
            const on = a.area === audit.area;
            return (
              <Link
                key={a.area ?? "all"}
                href={href({ area: a.area })}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-navy border-navy text-white" : "bg-card hover:bg-muted",
                )}
              >
                {a.area ?? "All"} <span className={cn("tabular-nums", on ? "text-navy-muted" : "text-muted-foreground")}>{a.n}</span>
              </Link>
            );
          })}
        </nav>
        {log.length ? (
          <Table>
            <TableHeader>
              <TableRow className="text-[12px] hover:bg-transparent">
                <TableHead className="text-muted-foreground font-normal">Time</TableHead>
                <TableHead className="text-muted-foreground font-normal">Actor</TableHead>
                <TableHead className="text-muted-foreground font-normal">Action</TableHead>
                <TableHead className="text-muted-foreground font-normal">Entity</TableHead>
                <TableHead className="text-muted-foreground font-normal">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.map((a) => {
                const detail = compact(a.detail);
                return (
                  <TableRow key={a.id} className="text-[13px]">
                    <TableCell className="text-muted-foreground tabular-nums">{dateTime(a.at)}</TableCell>
                    <TableCell>{a.actor}</TableCell>
                    <TableCell><code className="font-mono text-[12px]">{a.action}</code></TableCell>
                    <TableCell>
                      {a.entity}
                      {a.entity_id && <span className="text-muted-foreground tabular-nums"> #{a.entity_id}</span>}
                    </TableCell>
                    <TableCell className="max-w-[28rem]">
                      <code title={detail.length > MAX_DETAIL ? detail : undefined}
                        className="text-muted-foreground block truncate font-mono text-[12px]">
                        {detail.length > MAX_DETAIL ? `${detail.slice(0, MAX_DETAIL)}…` : detail || "—"}
                      </code>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={ScrollText} title="Nothing audited yet" />
        )}
        {audit.pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4 text-[13px]">
            <span className="text-muted-foreground tabular-nums">Page {audit.page} of {audit.pages}</span>
            <div className="flex gap-2">
              {audit.page > 1 && (
                <Button variant="outline" size="sm" render={<Link href={href({ area: audit.area, page: audit.page - 1 })} />}>Newer</Button>
              )}
              {audit.page < audit.pages && (
                <Button variant="outline" size="sm" render={<Link href={href({ area: audit.area, page: audit.page + 1 })} />}>Older</Button>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
