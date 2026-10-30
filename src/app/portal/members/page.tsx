import { Mail, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { InviteForm } from "@/components/admin/invite-form";
import { RevokeButton } from "@/components/admin/revoke-button";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { date } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPrincipal } from "@/server/auth";
import { listMembers, organisations } from "@/server/members";
import { isForbidden, load } from "@/server/page";
import { can, CLIENT_ASSIGNABLE, ROLE_LABEL, ROLES, type Role } from "@/server/policy";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: PageProps<"/portal/members">) {
  const p = (await getPrincipal())!;
  const admin = can(p, "admin.orgs");
  const raw = (await searchParams).orgId;
  const requested = admin && typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : undefined;

  const data = await load((pp) => listMembers(pp, requested), "/portal/members");
  if (isForbidden(data)) return <Forbidden message={data.forbidden} />;
  const orgs = admin ? await organisations(p) : [];
  const orgId = requested ?? p.orgId ?? 0;
  const orgName = admin ? (orgs.find((o) => o.id === orgId)?.name ?? "Unknown organisation") : (p.orgName ?? "");
  const roleOptions = (can(p, "admin.roles") ? [...ROLES] : CLIENT_ASSIGNABLE).map((r) => ({ value: r, label: ROLE_LABEL[r] }));
  const label = (r: string) => ROLE_LABEL[r as Role] ?? r;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={
          admin
            ? `People and invitations in ${orgName}. As a portal administrator you can manage any organisation.`
            : `People who can sign in to ${orgName}, and invitations you've sent.`
        }
      />

      {admin && orgs.length > 0 && (
        <nav aria-label="Organisation" className="flex flex-wrap gap-1.5">
          {orgs.map((o) => {
            const on = o.id === orgId;
            return (
              <Link
                key={o.id}
                href={`/portal/members?orgId=${o.id}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring inline-flex h-9 items-center rounded-full px-3.5 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-2",
                  on ? "bg-foreground text-background font-medium" : "bg-card hover:bg-muted",
                )}
              >
                {o.name}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="min-w-0 space-y-3">
          <Panel title="Members" description={`${data.members.filter((m) => m.status === "active").length} active`}>
            {data.members.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="text-muted-foreground text-[12px] hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-normal">Name</TableHead>
                    <TableHead className="text-muted-foreground font-normal">Roles</TableHead>
                    <TableHead className="text-muted-foreground font-normal">Status</TableHead>
                    <TableHead className="text-muted-foreground font-normal">Joined</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.members.map((m) => {
                    const self = m.email === p.email;
                    return (
                      <TableRow key={m.id} className="text-[14px]">
                        <TableCell>
                          <p className="font-medium">{m.name}{self && <span className="text-muted-foreground font-normal"> (you)</span>}</p>
                          <p className="text-muted-foreground text-[12px]">{m.email}</p>
                        </TableCell>
                        <TableCell className="text-[13px]">{m.roles.map(label).join(", ")}</TableCell>
                        <TableCell><StatusBadge value={m.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-[13px] tabular-nums">{date(m.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {m.status === "active" && !self && <RevokeButton membershipId={m.id} name={m.name} org={orgName} />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={Users} title="No members yet" description="Invite someone to get started." />
            )}
          </Panel>

          <Panel title="Invitations" description="Single-use links tied to one email address">
            {data.invitations.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="text-[12px] hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-normal">Email</TableHead>
                    <TableHead className="text-muted-foreground font-normal">Role</TableHead>
                    <TableHead className="text-muted-foreground font-normal">State</TableHead>
                    <TableHead className="text-muted-foreground font-normal">Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invitations.map((i) => (
                    <TableRow key={i.id} className="text-[14px]">
                      <TableCell>{i.email}</TableCell>
                      <TableCell className="text-[13px]">{label(i.role)}</TableCell>
                      <TableCell><StatusBadge value={i.state} /></TableCell>
                      <TableCell className="text-muted-foreground text-[13px] tabular-nums">
                        {i.state === "Pending" || i.state === "Expired" ? date(i.expires_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={Mail} title="No invitations sent" />
            )}
          </Panel>
        </div>

        <Panel title="Invite someone" description={can(p, "admin.roles") ? "Any organisation, any role" : `Into ${orgName}, as a client member or administrator`} className="self-start">
          <InviteForm
            key={orgId}
            roles={roleOptions}
            orgs={can(p, "admin.roles") ? orgs.map((o) => ({ value: String(o.id), label: o.name })) : undefined}
            defaultOrgId={orgId}
          />
        </Panel>
      </div>
    </div>
  );
}
