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
];

export default async function Home() {
  const [products, broadcasts] = await Promise.all([listContent(null, "product"), listContent(null, "broadcast")]);
  const next = upcoming(broadcasts)[0];
  const ordered = [...products].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      {/* S0 — the fold */}
      <section aria-labelledby="hero-title" className="bg-navy relative overflow-hidden text-white">
        {/* Azentio's mint as a quiet structural accent: two offset blocks at the right edge, as on azentio.com. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] lg:block">
          <div className="bg-brand-strong/15 absolute top-0 right-0 h-1/2 w-2/3" />
          <div className="bg-brand/10 absolute right-1/3 bottom-0 h-1/3 w-1/3" />
        </div>
        <Wrap className="relative grid gap-12 pt-14 pb-16 md:pt-[84px] md:pb-24 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7 lg:pr-10">
            <p className="text-brand inline-flex items-center gap-2 text-[14px] font-medium">
              <span aria-hidden className="bg-brand size-1.5 rounded-full" /> Governed collective learning for BFSI
            </p>
            <h1
              id="hero-title"
              className="mt-5 text-[42px] leading-[48px] font-semibold tracking-[-0.03em] text-balance md:text-[58px] md:leading-[64px]"
            >
              Banks learn from each other. <span className="text-brand">Nobody sees who said what.</span>
            </h1>
            <p className="text-navy-muted mt-6 max-w-[34rem] text-[18px] leading-[29px]">
              azentio.ai brings Azentio&apos;s AI credit products together with a portal where client organisations share
              what they see in their markets, reviewed, de-identified and governed by their own consent.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
              <Button size="lg" className="h-12 px-6 text-[15px]" render={<Link href="/connect" />}>
                Request a demo <ArrowRight />
              </Button>
              <Link
                href="#safe"
                className="hover:text-brand inline-flex items-center gap-1.5 self-start rounded-sm text-[15px] font-medium text-white underline decoration-white/40 decoration-1 underline-offset-[6px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand sm:self-auto"
              >
                How sharing stays safe
              </Link>
            </div>
          </div>
          <div className="text-foreground lg:col-span-5 lg:self-center">
            <RedactionArtifact />
          </div>
        </Wrap>
      </section>

      {/* S1 — products as an index, not cards */}
      <section aria-labelledby="products-title" className="py-16 md:py-24">
        <Wrap>
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 id="products-title" className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em]">Products</h2>
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
      <section id="safe" aria-labelledby="safe-title" className="bg-brand-soft scroll-mt-20 py-16 md:py-24">
        <Wrap className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h2 id="safe-title" className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-balance md:text-[44px] md:leading-[48px] md:tracking-[-0.025em]">
                How sharing stays safe
              </h2>
              <p className="text-muted-foreground mt-4 max-w-sm text-[16px] leading-6">
                The first question every client asks: could this reach a competitor? Here is exactly what happens to an
                observation, in the order it happens.
              </p>
            </div>
          </div>
          <ol className="bg-card shadow-card divide-y overflow-hidden rounded-2xl border lg:col-span-8">
            {LIFECYCLE.map((s, i) => (
              <li key={s.state} className="grid gap-3 px-6 py-6 sm:grid-cols-8 sm:gap-6 sm:px-7">
                <span className="sm:col-span-2">
                  <span className="bg-navy text-brand inline-flex h-7 items-center gap-2 rounded-full pr-3 pl-1 font-mono text-[12px]">
                    <span className="bg-brand text-brand-foreground grid size-5 place-items-center rounded-full text-[11px] font-semibold">{i + 1}</span>
                    {s.state}
                  </span>
                </span>
                <div className="sm:col-span-6">
                  <h3 className="text-[19px] leading-[28px] tracking-[-0.015em]">{s.title}</h3>
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
          <div className="lg:col-span-7">
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

      {/* S4 — AI that can only say what the evidence shows */}
      <section aria-labelledby="aira-title" className="py-16 md:py-24">
        <Wrap className="grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8 lg:col-start-3">
            <h2 id="aira-title" className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-balance md:text-[44px] md:leading-[48px] md:tracking-[-0.025em]">
              AI that can only say what the evidence shows.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-2xl text-[17px] leading-[27px]">
              AIRA summarises a theme from approved, de-identified copies and nothing else. Every quote it relies on is
              checked against its source before the summary is saved, and a summary that can&apos;t be backed isn&apos;t kept.
            </p>
            <blockquote className="bg-card shadow-card border-brand-strong mt-10 rounded-r-2xl border border-l-4 px-7 py-6">
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
      <section aria-labelledby="close-title" className="pb-20 md:pb-28">
        <Wrap>
        <div className="bg-navy relative grid gap-12 overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-10 md:py-16 lg:grid-cols-12 lg:gap-6 lg:px-14">
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
