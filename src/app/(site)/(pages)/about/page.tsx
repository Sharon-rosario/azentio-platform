import { ArrowRight, Building2, Compass, Eye, ShieldCheck, Target, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { SiteTitle } from "@/components/site/content-index";
import { Button } from "@/components/ui/button";

type CSSVars = CSSProperties & Record<`--${string}`, string>;

export const metadata: Metadata = {
  title: "About",
  description: "azentio.ai builds practical, responsible AI products for financial services, and a portal where clients learn from each other safely.",
};

// Mission, vision and principles as written in the reference prototype (the brief asks to reuse its content).
const PRINCIPLES = [
  { icon: Target, title: "Our mission", body: "Engineer practical, responsible and impactful AI products that simplify complexity and enable better decisions." },
  { icon: Eye, title: "Our vision", body: "A future where intelligence is seamlessly embedded into everyday enterprise experiences." },
  { icon: Compass, title: "Build with purpose", body: "Start with real problems and measure meaningful outcomes." },
  { icon: ShieldCheck, title: "Engineer for trust", body: "Make security, accountability and human oversight foundational." },
];

const AUDIENCES = [
  { icon: Users, who: "Visitors", gets: "Products, solutions, insights and public sessions; demo requests and hackathon registration." },
  { icon: Building2, who: "Client organisations", gets: "A private workspace with entitled demos and sessions, and a governed way to share what they see in their markets." },
  { icon: Compass, who: "Azentio teams", gets: "Internal experiments, broadcasts and a playground, and the themes that turn client learning into product improvements." },
];

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <SiteTitle title="Built on curiosity. Driven by purpose." highlight="Driven by purpose.">
        We combine domain understanding, product thinking, AI engineering and a culture of experimentation to build
        intelligent solutions for financial services.
      </SiteTitle>

      <ul className="grid gap-5 sm:grid-cols-2">
        {PRINCIPLES.map((p, i) => (
          <li key={p.title} data-reveal style={{ "--reveal-delay": `${(i % 2) * 70}ms` } as CSSVars} className="bg-card shadow-card lift rounded-2xl border p-6 sm:p-7">
            <span className="bg-navy text-brand grid size-11 place-items-center rounded-xl">
              <p.icon aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-[20px] leading-[28px] tracking-[-0.02em]">{p.title}</h2>
            <p className="text-muted-foreground mt-2 text-[16px] leading-[25px]">{p.body}</p>
          </li>
        ))}
      </ul>

      <section data-reveal aria-labelledby="platform-title" className="bg-navy relative overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10 md:py-14">
        <div aria-hidden className="bg-brand-strong/15 pointer-events-none absolute -top-10 -right-10 size-56 rotate-12 rounded-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <h2 id="platform-title" className="text-[30px] leading-[38px] tracking-[-0.025em] md:text-[36px] md:leading-[44px]">
              One platform, three audiences, one set of rules.
            </h2>
            <p className="text-navy-muted mt-4 text-[16px] leading-[26px]">
              Each audience sees only what it&apos;s entitled to. The server decides that on every request, not the menu
              in the browser.
            </p>
            <Link
              href="/security"
              className="bg-brand text-brand-foreground hover:bg-brand-strong mt-7 inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              How access is enforced <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="space-y-3 lg:col-span-6 lg:col-start-7">
            {AUDIENCES.map((a) => (
              <li key={a.who} className="bg-navy-2 flex gap-4 rounded-2xl border border-white/10 p-5">
                <span className="bg-brand text-brand-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                  <a.icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-[16px] leading-6">{a.who}</h3>
                  <p className="text-navy-muted mt-1 text-[14px] leading-[22px]">{a.gets}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-reveal aria-labelledby="next-title" className="bg-card shadow-card flex flex-col gap-6 rounded-2xl border p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="next-title" className="text-[22px] leading-[30px] tracking-[-0.02em]">The next intelligent idea starts here.</h2>
          <p className="text-muted-foreground mt-1.5 text-[15px] leading-6">
            Explore the products, share a challenge, or build with us at a hackathon.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="h-11 px-5 text-[15px]" render={<Link href="/connect" />}>Request a demo <ArrowRight /></Button>
          <Button variant="outline" size="lg" className="h-11 px-5 text-[15px]" render={<Link href="/hackathon/register" />}>Hackathons</Button>
        </div>
      </section>
    </div>
  );
}
