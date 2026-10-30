import { BadgeCheck, EyeOff, FileClock, FlaskConical, KeyRound, ShieldCheck, ShieldHalf, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Banner } from "@/components/banner";
import { PageHeader, Panel } from "@/components/states";
import { MIN_ORGS } from "@/server/insights";

export const metadata: Metadata = {
  title: "Security overview",
  description: "How the azentio.ai portal protects identities, tenants, shared learning and AI output.",
};

type Section = { id: string; icon: LucideIcon; title: string; lead: string; points: ReactNode[] };

const SECTIONS: Section[] = [
  {
    id: "identity",
    icon: KeyRound,
    title: "Identity and sessions",
    lead: "Passwordless sign-in with email codes, and sessions the server controls.",
    points: [
      <>Sign-in uses a 6-digit code sent by email. Codes are stored only as an <b>HMAC hash</b>, work <b>once</b>, and expire after <b>10 minutes</b>.</>,
      <>Requests for codes and wrong guesses are <b>rate limited</b>, and the code is checked with a <b>constant-time comparison</b>. The response never reveals whether an address has an account.</>,
      <>Sessions are <b>opaque random ids</b> held on the server (only a hash is stored). The cookie is <b>HttpOnly</b> and <b>SameSite</b>, and in production uses the <code>__Host-</code> prefix, so it is HTTPS-only and can&apos;t be set by a subdomain.</>,
      <>Memberships and roles are <b>reloaded on every request</b>, so removing someone from an organisation takes effect immediately, not at their next sign-in.</>,
    ],
  },
  {
    id: "authorization",
    icon: ShieldCheck,
    title: "Authorisation and tenant isolation",
    lead: "One server-side function decides every access, and it denies by default.",
    points: [
      <><b>Deny-by-default role-based access control</b>: a role can do only what it is explicitly granted.</>,
      <><b>Tenant isolation</b>: data is scoped to the organisation you&apos;re working in. A user in two organisations works in one at a time and switches explicitly.</>,
      <><b>Audience and entitlement checks</b>: employee content, client content and product demos are filtered on the server by who you are and which products your organisation uses.</>,
      <>All of this runs in a single <code>authorize()</code> function used by every page and API route. The interface only hides what the server would refuse anyway.</>,
      <>Asking for another tenant&apos;s record answers <b>404 Not found</b>, the same as a record that doesn&apos;t exist, so ids can&apos;t be probed.</>,
    ],
  },
  {
    id: "data",
    icon: EyeOff,
    title: "Data minimisation and shared learning",
    lead: "Contributions are private until their author decides otherwise, and what is shared is a reviewed copy.",
    points: [
      <><b>Private by default</b>: a new observation is a draft only its author can see.</>,
      <><b>Consent per purpose</b>: storing, publishing to shared learning, attribution and use for improvement are separate choices, each recorded with its history.</>,
      <>A moderator publishes a <b>separate de-identified shared copy</b>. The original is never shown to other organisations.</>,
      <><b>Sensitive-content scanning</b> flags things like email addresses, phone, account and card numbers before a moderator reviews. It is a warning, not a guarantee: a person still reads every proposed copy.</>,
      <><b>Small-cohort suppression</b>: a theme stays hidden until at least {MIN_ORGS} different organisations have contributed to it, so no single organisation can be singled out.</>,
      <>An author can <b>withdraw</b> at any time. The shared copy is removed and summaries built on it are cleared in the same transaction.</>,
    ],
  },
  {
    id: "ai",
    icon: BadgeCheck,
    title: "AI governance",
    lead: "AIRA, the portal's AI assistant, works only from approved material and must show its evidence.",
    points: [
      <>AIRA sees <b>approved, de-identified shared copies only</b>: never drafts, originals or another organisation&apos;s private data.</>,
      <>Its output is <b>structured and validated</b> against a schema before anything is used.</>,
      <>Every quote it cites is <b>checked word for word</b> against the contribution it claims to come from. Quotes that don&apos;t match are dropped.</>,
      <>A summary that no verified quote supports is <b>discarded, not saved</b>.</>,
      <>When a source is withdrawn, <b>summaries that used it are purged</b>.</>,
    ],
  },
  {
    id: "platform",
    icon: ShieldHalf,
    title: "Platform hardening",
    lead: "Defence in depth on every response.",
    points: [
      <>A <b>Content Security Policy</b> that allows same-origin resources only (inline scripts are still permitted for Next.js hydration), with <code>frame-ancestors &apos;none&apos;</code> so no other site can frame the portal.</>,
      <><b>HSTS</b>, <code>X-Content-Type-Options: nosniff</code>, a strict referrer policy, and a permissions policy that turns off camera, microphone, location and payment APIs.</>,
      <>API responses are sent with <code>Cache-Control: no-store</code>, so browsers and proxies don&apos;t keep personal data.</>,
      <>Every write is checked for a <b>same-origin</b> request, which together with the SameSite cookie blocks cross-site request forgery.</>,
    ],
  },
  {
    id: "audit",
    icon: FileClock,
    title: "Audit",
    lead: "Every state change leaves a record.",
    points: [
      <>The audit log is <b>append-only</b>: entries are added, never edited.</>,
      <>Each entry is written <b>in the same database transaction</b> as the change it records, so a change can&apos;t happen without its audit row.</>,
      <>Sign-ins, consent changes, moderation decisions, withdrawals, membership changes, AI summaries and public requests are all recorded.</>,
    ],
  },
  {
    id: "simulated",
    icon: FlaskConical,
    title: "What's simulated in this demo",
    lead: "Built for the azentio.ai Build Labs challenge on synthetic data. Some parts stand in for production services.",
    points: [
      <><b>No email provider.</b> Codes and invitations go to a demo outbox, and the outbox only shows messages for synthetic addresses (the seeded personas and the reserved <code>.example</code> domain), so a real person&apos;s code is never displayed.</>,
      <><b>Federated learning is out of scope.</b> Shared learning here is moderated, de-identified copies on one platform; no model is trained across organisations.</>,
      <>All organisations, people and figures are synthetic.</>,
    ],
  },
];

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security overview"
        description="How the portal protects identities, tenants, shared learning and AI output. Written for reviewers: what the code does, not marketing claims."
      />
      <Banner tone="info" title="Every check happens on the server">
        The interface hides actions you can&apos;t take, but that&apos;s a convenience. The server checks every request
        again, so a hidden button is never the only thing standing in the way.
      </Banner>

      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="lg:sticky lg:top-24">
          <p className="text-muted-foreground mb-2 text-[12px] font-medium">On this page</p>
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-8 items-center rounded-full px-3 text-[13px] whitespace-nowrap outline-none focus-visible:ring-2"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-24">
              <Panel
                title={
                  <span className="flex items-center gap-2">
                    <s.icon className="text-muted-foreground size-4" strokeWidth={1.75} aria-hidden /> {s.title}
                  </span>
                }
                description={s.lead}
              >
                <ul className="list-disc space-y-2 pl-5 text-[14px] leading-[22px] marker:text-muted-foreground [&_b]:font-medium [&_code]:bg-muted [&_code]:rounded-md [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12px]">
                  {s.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </Panel>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
