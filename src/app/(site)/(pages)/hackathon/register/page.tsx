import type { Metadata } from "next";

import { RequestForm } from "@/components/site/request-form";
import { PageHeader, Panel } from "@/components/states";

export const metadata: Metadata = { title: "Hackathons" };

export default function HackathonRegisterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hackathons"
        description="Build with the azentio.ai Build Labs team on problems from lending, risk and reporting."
      />
      <div className="grid items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Register your interest" description="We'll get in touch when the next event is announced">
          <RequestForm kind="hackathon" />
        </Panel>
        <Panel title="What to expect">
          <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-[14px] leading-[22px]">
            <li>Challenge briefs built on synthetic data, so no customer data is involved.</li>
            <li>Teams and individuals are welcome; tell us what you&apos;d like to build.</li>
            <li>Registering interest doesn&apos;t commit you to anything. No confirmation email is sent from this demo.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
