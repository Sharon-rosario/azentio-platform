import type { Metadata } from "next";
import Link from "next/link";

import { Banner } from "@/components/banner";
import { ObservationForm } from "@/components/learning/observation-form";
import { Forbidden } from "@/components/portal/forbidden";
import { PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getPrincipal } from "@/server/auth";
import { CATEGORIES, CONFIDENCE, getObservation } from "@/server/learning";
import { isForbidden, load } from "@/server/page";

export const metadata: Metadata = { title: "Edit observation" };

export default async function EditObservationPage({ params }: PageProps<"/portal/observations/[id]/edit">) {
  const { id } = await params;
  const p = (await getPrincipal())!;
  const o = await load((p) => getObservation(p, Number(id)), `/portal/observations/${id}/edit`);
  if (isForbidden(o)) return <Forbidden message={o.forbidden} />;
  if (!o.mine) return <Forbidden message="Only the author can edit this" />;

  const editable = ["draft", "returned", "published"].includes(o.status);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit observation" description={o.title} actions={<StatusBadge value={o.status} />} />
      {editable ? (
        <Panel>
          <ObservationForm
            categories={CATEGORIES}
            confidence={CONFIDENCE}
            orgName={p.orgName ?? "your organisation"}
            edit={{
              id: o.id,
              status: o.status,
              visibility: o.visibility,
              values: {
                title: o.title,
                body: o.body,
                category: o.category,
                offering: o.offering,
                period: o.period,
                evidence_type: o.evidence_type,
                confidence: o.confidence,
              },
            }}
          />
        </Panel>
      ) : (
        <Banner
          tone="info"
          title="This can't be edited right now"
          action={
            <Button variant="outline" size="sm" render={<Link href={`/portal/observations/${o.id}`} />}>
              Back to the observation
            </Button>
          }
        >
          {o.status === "submitted"
            ? "It's with a moderator. You can edit it again once it's published or returned to you."
            : "Withdrawn and declined observations are kept as they were, for the record."}
        </Banner>
      )}
    </div>
  );
}
