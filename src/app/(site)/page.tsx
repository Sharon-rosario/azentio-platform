import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProductIndex, upcoming } from "@/components/site/content-index";
import { RedactionArtifact } from "@/components/site/redaction-artifact";
import { Button } from "@/components/ui/button";
import { date } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listContent } from "@/server/content";
import { MIN_ORGS } from "@/server/insights";

export const metadata: Metadata = {
  title: { absolute: "azentio.ai · Banks learn from each other. Nobody sees who said what." },
  description:
    "Azentio's AI credit products, and a portal where client organisations share market observations that are reviewed, de-identified and governed by their own consent.",
};

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
];

export default async function Home() {
  const [products, broadcasts] = await Promise.all([listContent(null, "product"), listContent(null, "broadcast")]);
  const next = upcoming(broadcasts)[0];
  const ordered = [...products].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      {/* S0 — the fold */}
      <section aria-labelledby="hero-title" className="border-b">
        <Wrap className="grid gap-12 pt-14 pb-16 md:pt-[72px] md:pb-24 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7 lg:pr-10">
            <h1
              id="hero-title"
              className="text-[44px] leading-[48px] font-normal tracking-[-0.025em] text-balance md:text-[60px] md:leading-[62px] md:tracking-[-0.03em]"
            >
              Banks learn from each other. Nobody sees who said what.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-[34rem] text-[20px] leading-[28px] tracking-[-0.01em]">
              azentio.ai brings Azentio&apos;s AI credit products together with a portal where client organisations share
              what they see in their markets, reviewed, de-identified and governed by their own consent.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
              <Button size="lg" className="h-11 px-5 text-[15px]" render={<Link href="/connect" />}>
                Request a demo <ArrowRight />
              </Button>
              <Link
                href="#safe"
                className="hover:text-primary inline-flex items-center gap-1.5 self-start rounded-sm text-[15px] font-medium underline decoration-1 underline-offset-[6px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring sm:self-auto"
              >
                How sharing stays safe
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 lg:self-center">
            <RedactionArtifact />
          </div>
        </Wrap>
      </section>

      {/* S1 — products as an index, not cards */}
      <section aria-labelledby="products-title" className="py-16 md:py-24">
        <Wrap>
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 id="products-title" className="text-[32px] leading-[38px] font-normal tracking-[-0.02em]">Products</h2>
              <p className="text-muted-foreground mt-2 text-[16px] leading-6">Credit, risk and reporting software for banks and lenders.</p>
            </div>
            <Link href="/products" className="text-muted-foreground hover:text-foreground hidden shrink-0 rounded-sm text-[14px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring sm:inline">
              All products
            </Link>
          </div>
          <div className="mt-10">
            <ProductIndex products={ordered} />
          </div>
        </Wrap>
      </section>

      {/* S2 — the objection, answered with the actual lifecycle */}
      <section id="safe" aria-labelledby="safe-title" className="bg-card scroll-mt-20 border-y py-16 md:py-24">
        <Wrap className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h2 id="safe-title" className="text-[32px] leading-[38px] font-normal tracking-[-0.02em] text-balance md:text-[44px] md:leading-[48px] md:tracking-[-0.025em]">
                How sharing stays safe
              </h2>
              <p className="text-muted-foreground mt-4 max-w-sm text-[16px] leading-6">
                The first question every client asks: could this reach a competitor? Here is exactly what happens to an
                observation, in the order it happens.
              </p>
            </div>
          </div>
          <ol className="border-t lg:col-span-8">
            {LIFECYCLE.map((s) => (
              <li key={s.state} className="grid gap-2 border-b py-7 sm:grid-cols-8 sm:gap-6">
                <span className="text-muted-foreground font-mono text-[13px] leading-[26px] sm:col-span-2">{s.state}</span>
                <div className="sm:col-span-6">
                  <h3 className="text-[20px] leading-[28px] tracking-[-0.01em]">{s.title}</h3>
                  <p className="text-muted-foreground mt-2 text-[15px] leading-6">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Wrap>
      </section>

      {/* S3 — the proof, checkable: an ink band with the real test names */}
      <section aria-labelledby="proof-title" className="bg-foreground text-background py-16 md:py-24">
        <Wrap className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5 lg:pr-8">
            <h2 id="proof-title" className="text-[32px] leading-[38px] font-normal tracking-[-0.02em] text-balance md:text-[44px] md:leading-[48px] md:tracking-[-0.025em]">
              Tested the way an attacker would try.
            </h2>
            <p className="mt-5 text-[16px] leading-6 text-[oklch(0.82_0.01_75)]">
              Every pull request runs a suite that signs in as different people and calls the API directly, skipping the
              interface entirely. Another organisation&apos;s data answers <span className="font-mono text-[14px]">404</span>, even by id.
            </p>
            <Link
              href="/security"
              className="mt-8 inline-flex items-center gap-1.5 rounded-sm text-[15px] font-medium underline decoration-1 underline-offset-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.8_0.12_160)]"
            >
              Read the security overview <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="lg:col-span-7">
            <p className="font-mono text-[12px] leading-4 text-[oklch(0.75_0.01_75)]">tests/security.test.mjs · {TESTS.length} tests</p>
            <ul className="mt-4 border-t border-[oklch(1_0_0/0.14)]">
              {TESTS.map((t) => (
                <li key={t} className="flex gap-3 border-b border-[oklch(1_0_0/0.14)] py-2.5 font-mono text-[13px] leading-[18px]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-[oklch(0.78_0.14_160)]" strokeWidth={2.5} aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Wrap>
      </section>

      {/* S4 — AI that can only say what the evidence shows */}
      <section aria-labelledby="aira-title" className="py-16 md:py-24">
        <Wrap className="grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8 lg:col-start-3">
            <h2 id="aira-title" className="text-[32px] leading-[38px] font-normal tracking-[-0.02em] text-balance md:text-[44px] md:leading-[48px] md:tracking-[-0.025em]">
              AI that can only say what the evidence shows.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-2xl text-[17px] leading-[27px]">
              AIRA summarises a theme from approved, de-identified copies and nothing else. Every quote it relies on is
              checked against its source before the summary is saved, and a summary that can&apos;t be backed isn&apos;t kept.
            </p>
            <blockquote className="mt-10 border-l-2 border-primary pl-6">
              <p className="text-[24px] leading-[32px] tracking-[-0.015em] md:text-[28px] md:leading-[36px]">
                “Debt-service ratios computed on trailing three months look alarming in August.”
              </p>
              <footer className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] leading-4">
                <span className="text-primary inline-flex items-center gap-1.5">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> quote verified against its source
                </span>
                <span>shared copy · market observation · Jun-Sep 2026</span>
              </footer>
            </blockquote>
          </div>
        </Wrap>
      </section>

      {/* S5 — the action again, with what's next */}
      <section aria-labelledby="close-title" className="border-t pt-16 pb-20 md:pt-24 md:pb-28">
        <Wrap className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <h2 id="close-title" className="text-[44px] leading-[48px] font-normal tracking-[-0.025em] text-balance md:text-[60px] md:leading-[62px] md:tracking-[-0.03em]">
              See it on synthetic data, end to end.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl text-[17px] leading-[27px]">
              We&apos;ll walk you through the products and the portal: a contribution, its review, a theme and the
              improvement it leads to.
            </p>
            <Button size="lg" className="mt-9 h-11 px-5 text-[15px]" render={<Link href="/connect" />}>
              Request a demo <ArrowRight />
            </Button>
          </div>
          <div className="space-y-8 lg:col-span-4 lg:col-start-9 lg:pt-3">
            <div className="border-t pt-5">
              <p className="text-muted-foreground font-mono text-[12px] leading-4">next public broadcast</p>
              {next ? (
                <>
                  <p className="mt-2 text-[16px] leading-6 font-medium">{next.title}</p>
                  <p className="text-muted-foreground text-[14px] leading-5">{date(next.starts_at)} · {next.summary}</p>
                </>
              ) : (
                <p className="text-muted-foreground mt-2 text-[14px] leading-5">None scheduled right now.</p>
              )}
            </div>
            <div className="border-t pt-5">
              <p className="text-muted-foreground font-mono text-[12px] leading-4">build labs</p>
              <Link href="/hackathon/register" className="group mt-2 inline-flex items-center gap-1.5 rounded-sm text-[16px] leading-6 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Register interest in the next hackathon
                <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Wrap>
      </section>
    </>
  );
}
