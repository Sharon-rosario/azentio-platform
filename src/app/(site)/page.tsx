import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { upcoming } from "@/components/site/content-index";
import { Highlight } from "@/components/site/highlight";
import { AiraProof, FLOW_ART, FlowSteps, HeroOrbit, WithdrawStrip } from "@/components/site/home-visuals";
import { type Offering, OfferingGrid } from "@/components/site/product-art";
import { RevealOnScroll } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { SOLUTION_DETAIL } from "@/lib/catalog";
import { date } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listContent } from "@/server/content";
import { MIN_ORGS } from "@/server/insights";

export const metadata: Metadata = {
  title: { absolute: "azentio.ai · Banks learn from each other. Nobody sees who said what." },
  description:
    "Azentio's AI credit products, and a portal where client organisations share market observations that are reviewed, de-identified and governed by their own consent.",
};

type CSSVars = CSSProperties & Record<`--${string}`, string>;

/** The page's one container: 1280 max, 12 columns, gutters from the locked system. */
function Wrap({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-6", className)}>{children}</div>;
}

// The lifecycle an observation actually goes through (src/server/learning.ts); state names as the API uses them.
const LIFECYCLE = [
  { state: "draft", title: "Private until you choose.",
    body: "Saving never shares. Who can see it is an explicit choice: only you, your organisation, or the learning community." },
  { state: "submitted", title: "Consent, one purpose at a time.",
    body: "Publishing a copy, showing your organisation's name and any future model training are separate permissions, each recorded with a date." },
  { state: "published", title: "A different, reviewed copy.",
    body: "A moderator publishes a de-identified copy. Your organisation, the author and internal notes can't travel with it, and an email or account number blocks publication." },
  { state: "theme", title: `Counted by organisation, shown at ${MIN_ORGS}.`,
    body: `A theme appears only when at least ${MIN_ORGS} different organisations stand behind it. Repeat posts from one organisation count once.` },
  { state: "withdrawn", title: "Gone, everywhere, at once.",
    body: "Withdraw it and the copy leaves the feed, search and AI summaries in the same database transaction." },
];

// The four solutions shown beside the products on the home page; the rest are on /solutions.
const HOME_SOLUTIONS = ["intelligent-decisioning", "document-intelligence", "ai-agents-automation", "trusted-enterprise-ai"];

// Verbatim test names from tests/security.test.mjs, which runs on every pull request.
const TESTS = [
  "signed out: only public content, everything else refused",
  "a wrong code is refused, and a code works once",
  "a new verified email gets no organisation: no tenant is trusted by default",
  "tenant isolation: another organisation's observation is not found, even by id",
  "a private draft stays private, even inside the same organisation",
  "roles: clients can't moderate or administer; admins can't read client observations",
  "a moderator never sees unsubmitted drafts",
  "client admins can't escalate or reach another tenant",
  "content follows audience and entitlements",
  "the shared feed carries no tenant, author or moderator data",
  "workspace switch only to memberships you hold, and one tenant at a time",
  "themes below three organisations are suppressed for clients, visible to moderators",
  "governed flow: submit → sensitive copy refused → redacted copy published → withdraw removes it at once",
  "revoking a membership takes effect on the next request",
  "cross-site writes are refused",
  "malformed input is refused with 4xx on every write route, never a 500",
  "a withdrawn copy can't be republished by restoring an open report on it",
  "publishing a new version retires a reported old one, so only one copy can ever be live",
  "visibility can't be changed around the review: community only via submit, and kept until withdrawal",
  "an employee without a publishing grant can't publish content",
  "the playground is for employees: a client gets the refusal, not the tool",
  "a sign-in code for a real mailbox is never shown, even in demo mode",
  "clients see an idea's status and public note, never its internal fields",
  "AIRA's input is published shared copies only: theme evidence has no tenant or author data",
  "the public request form is rate limited per source",
  "public request fields with the wrong types are refused, never a 500",
  "the audit log's hash chain verifies end to end after every write in this suite",
  "a de-identified copy names no exact industry, and a filter can't single out one organisation",
  "moderation and report fields with the wrong types are refused on real records, never a 500",
  "pages get a nonce-based script policy, fresh per request, and the API allows nothing to run",
  "an identifier in any published field blocks publication, not just in the title and text",
  "consent to publish must be an explicit yes: a string like \"false\" is refused",
  "parallel wrong guesses can't get past the five-attempt limit on a sign-in code",
  "a null origin, wrong-typed idea and content fields and a malformed portal id answer 4xx, never a 500",
];

export default async function Home() {
  const [products, solutions, broadcasts] = await Promise.all([
    listContent(null, "product"),
    listContent(null, "solution"),
    listContent(null, "broadcast"),
  ]);
  const next = upcoming(broadcasts)[0];
  // Published copy wins over the catalogue's, as on /solutions.
  const offerings: Offering[] = [
    ...[...products]
      .filter((p) => p.slug)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((p) => ({ slug: p.slug!, href: `/products/${p.slug}`, kind: "Product" as const, title: p.title, summary: p.summary })),
    ...HOME_SOLUTIONS.map((slug) => {
      const row = solutions.find((s) => s.slug === slug);
      return { slug, href: `/solutions#${slug}`, kind: "Solution" as const, title: row?.title ?? SOLUTION_DETAIL[slug].title, summary: row?.summary ?? SOLUTION_DETAIL[slug].summary };
    }),
  ];

  return (
    <>
      <RevealOnScroll />

      {/* S0 — the fold */}
      <section aria-labelledby="hero-title" className="bg-navy relative overflow-hidden text-white">
        {/* A quiet dot grid and a mint glow behind the artifact: depth without decoration that competes. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgb(255_255_255/0.14)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
        <div aria-hidden className="bg-brand/20 pointer-events-none absolute top-1/4 right-[8%] hidden size-[460px] rounded-full blur-[120px] lg:block" />
        <Wrap className="relative grid gap-14 pt-14 pb-16 md:pt-[84px] md:pb-24 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7 lg:pr-10">
            <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pr-3.5 pl-2 text-[13px] font-medium">
              <span className="bg-brand text-brand-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold">BFSI</span>
              <span className="text-white/85">Governed collective learning</span>
            </p>
            <h1
              id="hero-title"
              className="hero-rise mt-6 text-[42px] leading-[50px] font-semibold tracking-[-0.03em] text-balance md:text-[60px] md:leading-[68px]"
              style={{ "--d": "80ms" } as CSSVars}
            >
              Banks learn from each other. <span className="text-brand">Nobody sees </span>
              <Highlight>who said what.</Highlight>
            </h1>
            <p className="hero-rise text-navy-muted mt-8 max-w-[34rem] text-[18px] leading-[29px]" style={{ "--d": "160ms" } as CSSVars}>
              azentio.ai brings Azentio&apos;s AI credit products together with a portal where client organisations share
              what they see in their markets, reviewed, de-identified and governed by their own consent.
            </p>
            <div className="hero-rise mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7" style={{ "--d": "240ms" } as CSSVars}>
              <Button size="lg" className="group h-12 px-6 text-[15px] shadow-[0_8px_24px_-8px_rgb(85_255_190/0.55)]" render={<Link href="/connect" />}>
                Request a demo <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
              <Link
                href="#safe"
                className="hover:text-brand inline-flex items-center gap-1.5 self-start rounded-sm text-[15px] font-medium text-white underline decoration-white/40 decoration-1 underline-offset-[6px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand sm:self-auto"
              >
                How sharing stays safe
              </Link>
            </div>
            {/* Facts the code enforces, not marketing numbers. */}
            <dl className="hero-rise mt-12 grid max-w-xl grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-6" style={{ "--d": "320ms" } as CSSVars}>
              {[
                [String(TESTS.length), "security tests on every pull request"],
                ["404", "for another organisation's data, even by id"],
                [`${MIN_ORGS}+`, "organisations before a theme is shown"],
              ].map(([n, l]) => (
                <div key={l} className="px-4 first:pl-0">
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-brand text-[26px] leading-8 font-semibold tracking-[-0.02em] tabular-nums">{n}</dd>
                  <dd aria-hidden className="text-navy-muted mt-1 text-[12px] leading-4">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hero-rise text-foreground lg:col-span-5 lg:self-center" style={{ "--d": "200ms" } as CSSVars}>
            <HeroOrbit />
          </div>
        </Wrap>
      </section>

      {/* S1 — products and solutions, each with a small drawing of what it does */}
      <section aria-labelledby="products-title" className="py-16 md:py-24">
        <Wrap>
          <div data-reveal className="flex items-end justify-between gap-6">
            <div>
              <p className="text-primary text-[13px] font-semibold">Products and solutions</p>
              <h2 id="products-title" className="mt-2 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-balance md:text-[40px] md:leading-[46px]">
                Credit, risk and reporting software for banks.
              </h2>
            </div>
            <p className="hidden shrink-0 gap-5 text-[14px] sm:flex">
              {[["/products", "All products"], ["/solutions", "All solutions"]].map(([href, label]) => (
                <Link key={href} href={href} className="text-muted-foreground hover:text-foreground rounded-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring">
                  {label}
                </Link>
              ))}
            </p>
          </div>
          <div className="mt-10">
            <OfferingGrid items={offerings} />
          </div>
        </Wrap>
      </section>

      {/* S2 — the objection, answered with the actual lifecycle, drawn */}
      <section id="safe" aria-labelledby="safe-title" className="bg-brand-soft scroll-mt-20 py-16 md:py-24">
        <Wrap>
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <p className="text-primary text-[13px] font-semibold">How sharing stays safe</p>
            <h2 id="safe-title" className="mt-2 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-balance md:text-[44px] md:leading-[50px] md:tracking-[-0.025em]">
              Could this reach a competitor? Here is what actually happens.
            </h2>
            <p className="text-muted-foreground mt-4 text-[16px] leading-[26px]">
              Every observation goes through the same states, in this order, and the server enforces each one.
            </p>
          </div>
          <div className="mt-12">
            <FlowSteps
              steps={[
                { ...LIFECYCLE[0], art: FLOW_ART.draft },
                { ...LIFECYCLE[1], art: FLOW_ART.consent },
                { ...LIFECYCLE[2], art: FLOW_ART.review },
                { ...LIFECYCLE[3], art: FLOW_ART.theme },
              ]}
            />
            <WithdrawStrip title={LIFECYCLE[4].title} body={LIFECYCLE[4].body} />
          </div>
        </Wrap>
      </section>

      {/* S3 — the proof, checkable: an ink band with the real test names */}
      <section aria-labelledby="proof-title" className="bg-foreground text-background py-16 md:py-24">
        <Wrap className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div data-reveal className="lg:col-span-5 lg:pr-8">
            <h2 id="proof-title" className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-balance md:text-[44px] md:leading-[48px] md:tracking-[-0.025em]">
              Tested the way an attacker would try.
            </h2>
            <p className="text-navy-muted mt-5 text-[16px] leading-[26px]">
              Every pull request runs a suite that signs in as different people and calls the API directly, skipping the
              interface entirely. Another organisation&apos;s data answers <span className="font-mono text-[14px]">404</span>, even by id.
            </p>
            <Link
              href="/security"
              className="bg-brand text-brand-foreground hover:bg-brand-strong mt-8 inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              Read the security overview <ArrowRight className="size-4" />
            </Link>
          </div>
          <div data-reveal className="lg:col-span-7" style={{ "--reveal-delay": "100ms" } as CSSVars}>
            <div className="bg-navy-2 overflow-hidden rounded-2xl border border-white/10 shadow-deep">
              <p className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-[12px] leading-4">
                <span className="text-navy-muted">tests/security.test.mjs</span>
                <span className="text-brand">{TESTS.length} passing</span>
              </p>
              <ul className="px-5 py-2">
                {TESTS.map((t) => (
                  <li key={t} className="flex gap-3 border-b border-white/[0.07] py-2.5 font-mono text-[13px] leading-[18px] last:border-0">
                    <Check className="text-brand mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Wrap>
      </section>

      {/* S4 — AI that can only say what the evidence shows: the quote beside its source */}
      <section aria-labelledby="aira-title" className="py-16 md:py-24">
        <Wrap>
          <div data-reveal className="max-w-2xl">
            <p className="text-primary text-[13px] font-semibold">AIRA</p>
            <h2 id="aira-title" className="mt-2 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-balance md:text-[44px] md:leading-[50px] md:tracking-[-0.025em]">
              AI that can only say what the evidence shows.
            </h2>
            <p className="text-muted-foreground mt-5 text-[17px] leading-[27px]">
              AIRA summarises a theme from approved, de-identified copies and nothing else. Every quote it relies on is
              checked against its source before the summary is saved, and a summary that can&apos;t be backed isn&apos;t kept.
            </p>
          </div>
          <div className="mt-12">
            <AiraProof />
          </div>
        </Wrap>
      </section>

      {/* S5 — the action again, with what's next */}
      <section aria-labelledby="close-title" className="pb-20 md:pb-28">
        <Wrap>
        <div data-reveal className="bg-navy relative grid gap-12 overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-10 md:py-16 lg:grid-cols-12 lg:gap-6 lg:px-14">
          <div aria-hidden className="bg-brand-strong/15 pointer-events-none absolute -right-10 -bottom-10 size-64 rotate-12 rounded-3xl" />
          <div className="relative lg:col-span-7">
            <h2 id="close-title" className="text-[36px] leading-[42px] font-semibold tracking-[-0.03em] text-balance md:text-[48px] md:leading-[54px]">
              See it on synthetic data, end to end.
            </h2>
            <p className="text-navy-muted mt-5 max-w-xl text-[17px] leading-[27px]">
              We&apos;ll walk you through the products and the portal: a contribution, its review, a theme and the
              improvement it leads to.
            </p>
            <Button size="lg" className="mt-9 h-11 px-5 text-[15px]" render={<Link href="/connect" />}>
              Request a demo <ArrowRight />
            </Button>
          </div>
          <div className="relative space-y-8 lg:col-span-4 lg:col-start-9 lg:pt-3">
            <div className="border-t border-white/15 pt-5">
              <p className="text-navy-muted font-mono text-[12px] leading-4">next public broadcast</p>
              {next ? (
                <>
                  <p className="mt-2 text-[16px] leading-6 font-medium">{next.title}</p>
                  <p className="text-navy-muted text-[14px] leading-5">{date(next.starts_at)} · {next.summary}</p>
                </>
              ) : (
                <p className="text-navy-muted mt-2 text-[14px] leading-5">None scheduled right now.</p>
              )}
            </div>
            <div className="border-t border-white/15 pt-5">
              <p className="text-navy-muted font-mono text-[12px] leading-4">build labs</p>
              <Link href="/hackathon/register" className="group hover:text-brand mt-2 inline-flex items-center gap-1.5 rounded-sm text-[16px] leading-6 font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand">
                Register interest in the next hackathon
                <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
        </Wrap>
      </section>
    </>
  );
}
