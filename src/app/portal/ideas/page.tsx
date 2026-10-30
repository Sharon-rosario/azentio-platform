import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";

import { IdeaStatusControl } from "@/components/insights/idea-status-control";
import { Forbidden } from "@/components/portal/forbidden";
import { RelativeTime } from "@/components/relative-time";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { PRODUCT_NAME } from "@/lib/products";
import { getPrincipal } from "@/server/auth";
import { IDEA_STATUSES, listIdeas } from "@/server/insights";
import { isForbidden, load } from "@/server/page";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Improvements" };

export default async function IdeasPage() {
  const ideas = await load((p) => listIdeas(p), "/portal/ideas");
  if (isForbidden(ideas)) return <Forbidden message={ideas.forbidden} />;
  const p = (await getPrincipal())!;
  const editable = can(p, "ideas.write");
  const client = p.orgKind === "client";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Improvements"
        description={
          client
            ? "Ideas that came out of shared learning, and where each one stands. You see the status and the public note."
            : "Improvement ideas linked to approved themes. Clients see the title, status and public note only."
        }
      />
      {ideas.length ? (
        <ul className="space-y-3">
          {ideas.map((i) => (
            <li key={i.id}>
              <Panel
                title={i.title}
                description={[PRODUCT_NAME[i.offering] ?? i.offering, i.theme && `Theme: ${i.theme}`].filter(Boolean).join(" · ")}
                action={<StatusBadge value={i.status} />}
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,22rem)]">
                  <div className="space-y-3">
                    {i.public_note ? (
                      <div>
                        <p className="text-muted-foreground text-[12px]">Public note</p>
                        <p className="mt-0.5 text-[14px] leading-[22px]">{i.public_note}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-[13px]">No public note yet.</p>
                    )}
                    {i.problem !== undefined && (
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <Internal label="Problem" value={i.problem} />
                        <Internal label="Proposed outcome" value={i.proposed_outcome} />
                        <Internal label="Priority" value={i.priority} />
                      </dl>
                    )}
                    <p className="text-muted-foreground text-[12px]">
                      Owner: {i.owner} · Updated <RelativeTime iso={i.updated_at} />
                    </p>
                  </div>
                  {editable && (
                    <IdeaStatusControl ideaId={i.id} status={i.status} note={i.public_note} statuses={IDEA_STATUSES} />
                  )}
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : (
        <Panel>
          <EmptyState
            icon={Lightbulb}
            title="No improvement ideas yet"
            description="Product owners create ideas from themes that have enough evidence behind them."
          />
        </Panel>
      )}
    </div>
  );
}

function Internal({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[12px]">{label} · internal</dt>
      <dd className="mt-0.5 text-[14px] leading-[22px]">{value || "—"}</dd>
    </div>
  );
}
