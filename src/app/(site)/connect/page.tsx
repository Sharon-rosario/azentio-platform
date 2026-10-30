import type { Metadata } from "next";

import { RequestForm } from "@/components/site/request-form";
import { PageHeader, Panel } from "@/components/states";
import { PRODUCT_NAME } from "@/lib/products";

export const metadata: Metadata = { title: "Request a demo" };

export default async function ConnectPage({ searchParams }: PageProps<"/connect">) {
  const raw = (await searchParams).product;
  const product = typeof raw === "string" && PRODUCT_NAME[raw] ? raw : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request a demo"
        description={
          product
            ? `Tell us a little about you and we'll arrange a walkthrough of ${PRODUCT_NAME[product]}.`
            : "Tell us a little about you and what you'd like to see."
        }
      />
      <div className="grid items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <RequestForm kind="demo" defaultProduct={product} />
        </Panel>
        <Panel title="What happens next">
          <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-[14px] leading-[22px]">
            <li>Your request is stored and recorded in the audit log, and a person at Azentio reads it.</li>
            <li>We only use these details to reply to this request.</li>
            <li>This is a demo environment: no confirmation email is sent, so please use synthetic details.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
