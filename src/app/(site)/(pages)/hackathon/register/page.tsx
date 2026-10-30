import type { Metadata } from "next";

import { Note, SiteTitle } from "@/components/site/content-index";
import { RequestForm } from "@/components/site/request-form";

export const metadata: Metadata = { title: "Hackathons" };

export default function HackathonRegisterPage() {
  return (
    <div className="space-y-12">
      <SiteTitle title="Build with us">
        Hackathons with the azentio.ai Build Labs team, on real problems from lending, risk and reporting.
      </SiteTitle>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
        <section aria-labelledby="register-title" className="lg:col-span-7">
          <h2 id="register-title" className="text-[24px] leading-[30px] tracking-[-0.015em]">Register your interest</h2>
          <p className="text-muted-foreground mt-2 mb-8 text-[15px] leading-6">We&apos;ll get in touch when the next event is announced.</p>
          <RequestForm kind="hackathon" />
        </section>
        <Note label="what to expect" className="lg:col-span-4 lg:col-start-9">
          <ul className="text-muted-foreground space-y-3">
            <li>Challenge briefs built on synthetic data, so no customer data is involved.</li>
            <li>Teams and individuals are welcome; tell us what you&apos;d like to build.</li>
            <li>Registering doesn&apos;t commit you to anything. No email is sent from this demo.</li>
          </ul>
        </Note>
      </div>
    </div>
  );
}
