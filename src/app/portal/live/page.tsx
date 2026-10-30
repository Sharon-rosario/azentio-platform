import { Radio } from "lucide-react";
import type { Metadata } from "next";

import { ContentForm } from "@/components/admin/content-form";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { dateTime } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { getPrincipal } from "@/server/auth";
import { listContent } from "@/server/content";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Live" };

const GROUPS = [
  { audience: "client", title: "Client sessions", description: "Invitation-only, for organisations using the product" },
  { audience: "employee", title: "Employee broadcasts", description: "Internal sessions and recordings" },
  { audience: "public", title: "Public", description: "Open to anyone, also listed on the website" },
];

export default async function LivePage() {
  const p = (await getPrincipal())!;
  const publisher = can(p, "content.publish");
  if (!can(p, "content.employee") && !can(p, "content.client") && !publisher) {
    return <Forbidden message="You don't have access to this" />;
  }
  // The service filters by audience and entitlement; whatever comes back is what this person may see.
  const sessions = await listContent(p, "broadcast");
  const groups = GROUPS.map((g) => ({ ...g, items: sessions.filter((s) => s.audience === g.audience) })).filter((g) => g.items.length);

  return (
    <div className="space-y-6">
      <PageHeader title="Live" description="Sessions and broadcasts you can join, grouped by who they're for." />
      <div className={publisher ? "grid gap-3 lg:grid-cols-[1fr_minmax(0,22rem)]" : ""}>
        <div className="min-w-0 space-y-3">
          {groups.length ? (
            groups.map((g) => (
              <Panel key={g.audience} title={g.title} description={g.description} action={<StatusBadge value={g.audience} />}>
                <ul className="divide-y">
                  {g.items.map((s) => (
                    <li key={s.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <Radio className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium">{s.title}</p>
                        <p className="text-muted-foreground text-[13px]">{s.summary}</p>
                        <p className="text-muted-foreground mt-1 text-[12px] tabular-nums">
                          {[s.starts_at ? dateTime(s.starts_at) : "No date set", s.product && (PRODUCT_NAME[s.product] ?? s.product)]
                            .filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))
          ) : (
            <Panel>
              <EmptyState icon={Radio} title="No sessions for you right now" description="New sessions appear here when a publisher schedules one for your audience." />
            </Panel>
          )}
        </div>
        {publisher && (
          <Panel title="Publish content" description="Sessions, insights, experiments or demos" className="self-start">
            <ContentForm />
          </Panel>
        )}
      </div>
    </div>
  );
}
