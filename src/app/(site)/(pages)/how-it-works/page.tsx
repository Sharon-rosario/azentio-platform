import { ArrowRight, Building2, Check, Minus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { SiteTitle } from "@/components/site/content-index";
import { Button } from "@/components/ui/button";

type CSSVars = CSSProperties & Record<`--${string}`, string>;

export const metadata: Metadata = {
  title: "How it works",
  description: "Who does what on azentio.ai: the banks that share, the Azentio teams that run it, and how one observation becomes a product improvement.",
};

// The demo personas (all fictional) and what each role is for. "can" and "cannot" mirror GRANTS in server/policy.ts.
type Persona = { name: string; role: string; org?: string; does: string; can: string[]; cannot: string[] };

const BANKS: Persona[] = [
  { name: "Sara", role: "Client member", org: "Meridian Bank", does: "Writes observations, chooses who may see each one, and can withdraw any of them at any time.",
    can: ["Meridian's demos and sessions", "Write notes", "Shared learning", "Themes", "Improvement status"], cannot: ["Other banks' notes"] },
  { name: "Ravi", role: "Client administrator", org: "Meridian Bank", does: "Everything Sara can, plus managing Meridian's own people.",
    can: ["Invite and remove Meridian staff"], cannot: ["Give Azentio roles", "Touch another bank"] },
  { name: "Chen", role: "Client member", org: "Kestrel Finance", does: "A different bank. Learns from everyone's reviewed notes without knowing who wrote them.",
    can: ["Kestrel's workspace", "Reviewed copies from every bank"], cannot: ["Meridian's private notes"] },
  { name: "Maya", role: "Adviser", org: "Kestrel and Harbourline", does: "Works with two banks, and only ever sees one of them at a time.",
    can: ["Workspace switcher"], cannot: ["Both banks at once"] },
];

const AZENTIO: Persona[] = [
  { name: "Omar", role: "Learning moderator", does: "The editor: removes anything identifying, then publishes a separate, reviewed copy, or returns it with a reason.",
    can: ["Review queue", "Publish, return, decline", "Handle reports"], cannot: ["Private drafts"] },
  { name: "Priya", role: "Product owner", does: "Turns what banks report into product improvements, and tells them where each one stands.",
    can: ["Themes", "AIRA summaries", "Create and progress ideas"], cannot: ["Bank notes"] },
  { name: "Lena", role: "Content publisher", does: "Posts sessions and updates to the right audience: public, employees or client banks.",
    can: ["Publish content"], cannot: ["Members", "Moderation"] },
  { name: "Kavya", role: "Employee", does: "Explores internal sessions and the playground, and suggests improvements that stay internal until a product owner shares them.",
    can: ["Internal broadcasts", "Playground", "Suggest improvements"], cannot: ["Moderate or decide"] },
  { name: "Arjun", role: "Portal administrator", does: "Runs organisations, roles and the audit log. Even the administrator can't read a bank's notes.",
    can: ["Organisations and roles", "Hash-chained audit log"], cannot: ["Bank notes"] },
];

const STEPS = [
  { who: "Sara · Meridian", what: "Notices seasonal shops get flagged as risky in their off-season and writes it down.", key: "Private draft" },
  { who: "Sara", what: "Proposes it for sharing, allowing a reviewed copy but not her bank's name.", key: "Consent per purpose" },
  { who: "Omar · moderator", what: "Removes a phone number she left in and publishes a separate copy. Her original stays private.", key: "Reviewed copy" },
  { who: "Chen · Kestrel", what: "Reads the copy and recognises the same problem, with no idea who wrote it.", key: "Nobody knows who" },
  { who: "The platform", what: "Three different banks say something similar, so it becomes a theme. Below three, it stays hidden.", key: "Counted by bank" },
  { who: "AIRA", what: "Summarises the theme, quoting the contributions word for word, or saves nothing at all.", key: "Verified quotes" },
  { who: "Priya · product owner", what: "Turns the theme into an improvement idea. The banks get a plain status update.", key: "Improvement" },
  { who: "Sara, any time", what: "Withdraws her note. It leaves the feed, search and AI summaries at once.", key: "Gone, everywhere" },
];

// Feature rows against the nine personas, from GRANTS in server/policy.ts.
const COLS = ["Sara", "Ravi", "Chen", "Maya", "Omar", "Priya", "Lena", "Kavya", "Arjun"] as const;
type Cell = boolean | string;
const MATRIX: { group: string; rows: { feature: string; note?: string; cells: Cell[] }[] }[] = [
  { group: "Banks", rows: [
    { feature: "Own bank's demos and sessions", note: "only entitled products", cells: [true, true, true, true, false, false, false, false, false] },
    { feature: "Write observations", note: "private by default", cells: [true, true, true, true, false, false, false, false, false] },
    { feature: "Notes shared inside the bank", cells: [true, true, true, true, false, false, false, false, false] },
    { feature: "Report a shared copy", cells: [true, true, true, true, false, false, false, false, false] },
    { feature: "Invite and remove members", note: "own bank, client roles", cells: [false, true, false, false, false, false, false, false, "any org"] },
  ] },
  { group: "Shared learning", rows: [
    { feature: "Shared learning feed", note: "reviewed copies only", cells: [true, true, true, true, true, true, true, true, true] },
    { feature: "Themes", note: "hidden below three banks", cells: [true, true, true, true, "forming too", true, true, true, true] },
    { feature: "Improvement status", note: "banks see no internals", cells: [true, true, true, true, true, true, true, true, true] },
  ] },
  { group: "Azentio", rows: [
    { feature: "Review, redact, publish", cells: [false, false, false, false, true, false, false, false, false] },
    { feature: "Decide reports", cells: [false, false, false, false, true, false, false, false, false] },
    { feature: "AIRA summaries", cells: [false, false, false, false, true, true, false, false, false] },
    { feature: "Suggest improvements", note: "internal until shared", cells: [false, false, false, false, true, true, true, true, true] },
    { feature: "Create and progress ideas", cells: [false, false, false, false, false, true, false, false, false] },
    { feature: "Publish content", cells: [false, false, false, false, false, false, true, false, false] },
    { feature: "Internal content and playground", cells: [false, false, false, false, true, true, true, true, true] },
    { feature: "Organisations, roles, audit log", cells: [false, false, false, false, false, false, false, false, true] },
  ] },
];

function PersonaCard({ p, bank, i }: { p: Persona; bank: boolean; i: number }) {
  return (
    <li data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as CSSVars} className="bg-card shadow-card lift flex gap-4 rounded-2xl border p-5">
      <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-xl text-[18px] font-semibold ${bank ? "bg-brand-soft text-brand-strong" : "bg-navy text-brand"}`}>
        {p.name[0]}
      </span>
      <div className="min-w-0">
        <h4 className="text-[17px] leading-6 font-semibold">
          {p.name} <span className="text-muted-foreground text-[13px] font-normal">· {p.role}{p.org ? ` · ${p.org}` : ""}</span>
        </h4>
        <p className="text-muted-foreground mt-1 text-[14px] leading-[22px]">{p.does}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`What ${p.name} can and can't do`}>
          {p.can.map((c) => (
            <li key={c} className="bg-brand-soft text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]">
              <Check aria-hidden className="text-brand-strong size-3" strokeWidth={2.5} /> {c}
            </li>
          ))}
          {p.cannot.map((c) => (
            <li key={c} className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]">
              <Minus aria-hidden className="size-3" strokeWidth={2.5} /> {c}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="space-y-16">
      <SiteTitle title="Who does what, and how it all connects." highlight="how it all connects.">
        A suggestion box for competing banks, with a careful editor in the middle. Banks share what they see in their
        markets, Azentio turns it into better products, and nobody can tell which bank said what. Every person below is
        a fictional demo persona you can sign in as.
      </SiteTitle>

      <section aria-labelledby="sides-title" className="space-y-6">
        <h2 id="sides-title" className="text-[26px] leading-[34px] tracking-[-0.02em]">The two sides</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-brand-strong mb-3 flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] uppercase">
              <Building2 aria-hidden className="size-4" /> Banks · the people sharing
            </p>
            <ul className="space-y-3">{BANKS.map((p, i) => <PersonaCard key={p.name} p={p} bank i={i} />)}</ul>
          </div>
          <div>
            <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] uppercase">
              <Sparkles aria-hidden className="text-brand-strong size-4" /> Azentio · the people running it
            </p>
            <ul className="space-y-3">{AZENTIO.map((p, i) => <PersonaCard key={p.name} p={p} bank={false} i={i} />)}</ul>
          </div>
        </div>
      </section>

      <section data-reveal aria-labelledby="flow-title" className="bg-navy relative overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10 md:py-14">
        <div aria-hidden className="bg-brand pointer-events-none absolute top-0 right-24 hidden h-40 w-7 md:block" />
        <div aria-hidden className="bg-brand pointer-events-none absolute top-0 right-14 hidden h-28 w-7 md:block" />
        <div aria-hidden className="bg-brand pointer-events-none absolute top-0 right-4 hidden h-16 w-7 md:block" />
        <div className="relative">
          <h2 id="flow-title" className="text-[30px] leading-[38px] tracking-[-0.025em] md:text-[36px] md:leading-[44px]">
            One note, from a private thought to a better product.
          </h2>
          <p className="text-navy-muted mt-3 max-w-2xl text-[16px] leading-[26px]">
            Behind every step the server checks who you are, which bank you&apos;re in and what your role allows, then
            writes an audit record.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.key} className={`relative rounded-2xl border p-5 ${i === STEPS.length - 1 ? "border-brand border-dashed bg-white/5" : "bg-navy-2 border-white/10"}`}>
                <div className="flex items-center justify-between">
                  <span className="bg-brand text-brand-foreground grid size-8 place-items-center rounded-full text-[14px] font-semibold">{i + 1}</span>
                  <span className="text-brand text-[12px] font-medium">{s.key}</span>
                </div>
                <p className="text-brand mt-4 text-[12px] font-semibold tracking-[0.06em] uppercase">{s.who}</p>
                <p className="mt-1.5 text-[15px] leading-[23px] text-white/90">{s.what}</p>
                {i % 4 !== 3 && i !== STEPS.length - 1 && (
                  <ArrowRight aria-hidden className="text-brand absolute top-1/2 -right-3.5 hidden size-5 -translate-y-1/2 lg:block" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="matrix-title" className="space-y-4">
        <div>
          <h2 id="matrix-title" className="text-[26px] leading-[34px] tracking-[-0.02em]">Who can do what</h2>
          <p className="text-muted-foreground mt-1 text-[15px] leading-6">
            Exactly what the server enforces: anything not allowed here is refused, even through the API.
          </p>
        </div>
        <div data-reveal className="bg-card shadow-card overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[860px] border-collapse text-[14px]">
            <thead>
              <tr>
                <th scope="col" className="bg-navy px-4 py-3 text-left text-[13px] font-medium text-white">Feature</th>
                {COLS.map((c, i) => (
                  <th key={c} scope="col" className={`px-2 py-3 text-center text-[13px] font-medium ${i < 4 ? "bg-brand-strong text-white" : "bg-navy text-white"}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((g) => [
                <tr key={g.group}>
                  <th scope="colgroup" colSpan={COLS.length + 1} className="bg-muted text-muted-foreground px-4 py-2 text-left text-[12px] font-semibold tracking-[0.08em] uppercase">{g.group}</th>
                </tr>,
                ...g.rows.map((r) => (
                  <tr key={r.feature} className="border-t">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      {r.feature}
                      {r.note && <span className="text-muted-foreground block text-[12px]">{r.note}</span>}
                    </th>
                    {r.cells.map((v, i) => (
                      <td key={COLS[i]} className="px-2 py-2.5 text-center">
                        {v === false ? (
                          <Minus aria-label="Not allowed" className="text-muted-foreground/40 mx-auto size-4" />
                        ) : (
                          <span className="inline-flex flex-col items-center">
                            <Check aria-label="Allowed" className="text-brand-strong size-5" strokeWidth={2.5} />
                            {typeof v === "string" && <span className="text-brand-strong text-[11px] leading-3">{v}</span>}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </section>

      <section data-reveal aria-labelledby="try-title" className="bg-card shadow-card flex flex-col gap-6 rounded-2xl border p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="try-title" className="text-[22px] leading-[30px] tracking-[-0.02em]">Banks learn from each other. Nobody sees who said what.</h2>
          <p className="text-muted-foreground mt-1.5 text-[15px] leading-6">
            Sign in as any of the nine personas; the one-time code appears on screen in the demo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="h-11 px-5 text-[15px]" render={<Link href="/login" />}>Try a persona <ArrowRight /></Button>
          <Button variant="outline" size="lg" className="h-11 px-5 text-[15px]" render={<Link href="/security" />}>How access is enforced</Button>
        </div>
      </section>
    </div>
  );
}
