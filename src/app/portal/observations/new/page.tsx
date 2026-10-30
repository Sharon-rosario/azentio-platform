import type { Metadata } from "next";

import { ObservationForm } from "@/components/learning/observation-form";
import { Forbidden } from "@/components/portal/forbidden";
import { PageHeader, Panel } from "@/components/states";
import { getPrincipal } from "@/server/auth";
import { CATEGORIES, CONFIDENCE } from "@/server/learning";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Share an observation" };

export default async function NewObservationPage() {
  const p = (await getPrincipal())!;
  if (!can(p, "observations.write")) return <Forbidden message="You don't have access to this" />;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Share an observation"
        description="Saved as a draft. You decide who sees it, and nothing leaves your organisation without a moderator's review."
      />
      <Panel>
        <ObservationForm categories={CATEGORIES} confidence={CONFIDENCE} orgName={p.orgName ?? "your organisation"} />
      </Panel>
    </div>
  );
}
