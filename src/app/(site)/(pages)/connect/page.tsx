import type { Metadata } from "next";

import { Note, SiteTitle } from "@/components/site/content-index";
import { RequestForm } from "@/components/site/request-form";
import { PRODUCT_NAME } from "@/lib/products";

export const metadata: Metadata = { title: "Request a demo" };

export default async function ConnectPage({ searchParams }: PageProps<"/connect">) {
  const raw = (await searchParams).product;
  const product = typeof raw === "string" && PRODUCT_NAME[raw] ? raw : null;

  return (
    <div className="space-y-12">
      <SiteTitle title="Request a demo">
        {product
          ? `Tell us a little about you and we'll arrange a walkthrough of ${PRODUCT_NAME[product]}.`
          : "Tell us a little about you and what you'd like to see."}
      </SiteTitle>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <RequestForm kind="demo" defaultProduct={product} />
        </div>
        <Note label="what happens next" className="lg:col-span-4 lg:col-start-9">
          <ul className="text-muted-foreground space-y-3">
            <li>Your request is stored and recorded in the audit log, and a person at Azentio reads it.</li>
            <li>We only use these details to reply to this request.</li>
            <li>This is a demo environment: no email is sent, so please use synthetic details.</li>
          </ul>
        </Note>
      </div>
    </div>
  );
}
