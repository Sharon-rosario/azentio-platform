import { ArrowRight, BadgeCheck, EyeOff, FileCheck2, Lock, PenLine, Rocket, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BroadcastList, ProductGrid, upcoming } from "@/components/site/content-cards";
import { SectionHeading } from "@/components/site/section-heading";
import { Panel } from "@/components/states";
import { Button } from "@/components/ui/button";
import { listContent } from "@/server/content";
import { MIN_ORGS } from "@/server/insights";

export const metadata: Metadata = { title: { absolute: "azentio.ai · Build intelligence. Create shared value." } };

const STEPS = [
  { icon: PenLine, title: "Contribute privately", body: "A client writes a market observation. It stays a private draft until they choose to share it, and for which purposes." },
  { icon: EyeOff, title: "A moderator reviews and de-identifies", body: "An Azentio learning moderator removes names and identifying detail, then publishes a separate shared copy, returns it, or declines it." },
  { icon: Users, title: "Shared learning across organisations", body: `Shared copies are grouped into themes. A theme only appears once ${MIN_ORGS} or more organisations stand behind it.` },
  { icon: Rocket, title: "Product improvements you can follow", body: "Product owners turn themes into improvement ideas, and every contributor can see each idea's status." },
];

const TRUST = [
  { icon: Lock, title: "Server-side access control", body: "Every request is checked on the server, and each organisation's data is isolated from every other's." },
  { icon: ShieldCheck, title: "Private by default", body: "Nothing is shared without consent, given separately for each purpose." },
  { icon: EyeOff, title: "De-identified shared copies", body: "Only a reviewed copy is shared, never the original. Withdraw it and it disappears within seconds." },
  { icon: BadgeCheck, title: "AI that cites verified evidence", body: "AIRA summarises approved copies only, and every quote it uses is checked against its source." },
];

export default async function Home() {
  const [products, broadcasts] = await Promise.all([listContent(null, "product"), listContent(null, "broadcast")]);
  const next = upcoming(broadcasts);

  return (
    <div className="space-y-12">
      <section className="bg-card rounded-2xl px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-muted-foreground text-[13px] font-medium">Market intelligence, shared safely</p>
        <h1 className="mt-3 max-w-2xl text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-balance">
          Build intelligence. Create shared value.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-[15px] leading-6">
          One place for public discovery, employee innovation and client collaboration. What clients learn in the market
          becomes governed, collective learning that improves the products they use.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href="/connect" />}>
            Request a demo <ArrowRight />
          </Button>
          <Button variant="outline" render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </section>

      <section aria-labelledby="products" className="space-y-4">
        <SectionHeading id="products" title="Products" description="Credit, risk and reporting software for banks and lenders."
          action={<Button variant="ghost" size="sm" render={<Link href="/products" />}>All products <ArrowRight /></Button>} />
        <ProductGrid products={products} />
      </section>

      <section aria-labelledby="how" className="space-y-4">
        <SectionHeading id="how" title="How shared learning works"
          description="Clients learn from each other without exposing who said what." />
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="bg-card rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <span className="bg-muted text-muted-foreground grid size-8 place-items-center rounded-full text-[13px] font-medium tabular-nums">
                  {i + 1}
                </span>
                <s.icon className="text-muted-foreground size-4" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-4 text-[15px] leading-5 font-medium">{s.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-[14px] leading-[22px]">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="trust" className="space-y-4">
        <SectionHeading id="trust" title="Trusted by design" description="Security is the core of the portal, not a layer on top."
          action={<Button variant="ghost" size="sm" render={<Link href="/security" />}>Security overview <ArrowRight /></Button>} />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="bg-card flex gap-3 rounded-2xl p-5">
              <t.icon className="text-muted-foreground mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
              <div>
                <h3 className="text-[15px] leading-5 font-medium">{t.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-[14px] leading-[22px]">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Upcoming broadcasts" description="Public sessions anyone can join"
          action={<Button variant="ghost" size="sm" render={<Link href="/insights" />}>Insights <ArrowRight /></Button>}>
          <BroadcastList items={next} empty="No public broadcasts coming up" />
        </Panel>
        <Panel title="Build with us" description="Hackathons with the azentio.ai Build Labs team">
          <p className="text-[14px] leading-[22px]">
            Register your interest and we&apos;ll share dates and challenge briefs when the next event is announced.
          </p>
          <Button variant="outline" className="mt-4" render={<Link href="/hackathon/register" />}>
            <FileCheck2 /> Register interest
          </Button>
        </Panel>
      </div>
    </div>
  );
}
