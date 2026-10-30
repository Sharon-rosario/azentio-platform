import { Building2, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Banner } from "@/components/banner";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dateTime } from "@/lib/format";
import { auditLog, organisations } from "@/server/members";
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

export default async function AdminPage() {
  const data = await load(async (p) => ({ log: await auditLog(p), orgs: await organisations(p) }), "/portal/admin");
  if (isForbidden(data)) return <Forbidden message={data.forbidden} />;
  const { log, orgs } = data;

  return (
    <div className="space-y-6">
      <PageHeader title="Administration" description="Organisations on the portal and the audit log of privileged actions." />
      <Banner tone="info">
        Privileged actions are audited. Administrators can&apos;t read client contributions; that needs moderation rights.
      </Banner>

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

      <Panel title="Audit log" description={`Most recent ${log.length} entries, newest first.`}>
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
      </Panel>
    </div>
  );
}
