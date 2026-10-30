import type { Metadata } from "next";

import { Playground } from "@/components/insights/playground";
import { Forbidden } from "@/components/portal/forbidden";
import { PageHeader } from "@/components/states";
import { getPrincipal } from "@/server/auth";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Playground" };

export default async function PlaygroundPage() {
  const p = (await getPrincipal())!;
  if (!can(p, "playground.use")) return <Forbidden message="The playground is for Azentio employees" />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Playground"
        description="A guided sandbox for trying prototype ideas on synthetic applicants. Employees only."
      />
      <Playground />
    </div>
  );
}
