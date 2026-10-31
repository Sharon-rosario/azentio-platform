import "server-only";

import { SAMPLES, sampleText } from "@/lib/sample-observations";

import { aiCheck } from "./ai-check";
import { audit } from "./audit";
import { DEMO_MODE } from "./auth";
import { all, insert, now, run, tx } from "./db";
import { publish, reviewItem } from "./learning";
import { authorize, HttpError, type Principal } from "./policy";

// Autonomous moderation: with thousands of client organisations, a moderator can't read every contribution. For each
// item waiting for review, AIRA finds what identifies someone and rewrites the copy without it; the copy is then
// published through the same publish() a moderator uses (consent, scanner on every published field, row lock, audit).
// Anything uncertain is held for a human: AIRA unavailable, a rewrite that failed its checks, or a publish refusal.
// Nothing is ever deleted or declined automatically.

/** The steps an item goes through; `stage` is the last one it reached (where it was held, or "published"). */
export const AUTO_STEPS = ["received", "read", "rewrite", "checks", "published"] as const;
export type AutoStage = (typeof AUTO_STEPS)[number];
export type AutoOutcome = {
  id: number; title: string; org: string; outcome: "published" | "held"; stage: AutoStage; reason: string;
  findings: { kind: string; text: string }[]; kinds: string[]; publishedTitle?: string; ms: number; aiMs: number;
};

export async function autoModerate(p: Principal | null, id: number): Promise<AutoOutcome> {
  const started = Date.now();
  const item = await reviewItem(p, id); // moderation.review; 404 for anything not proposed for sharing
  const base = { id, title: item.title, org: item.org };
  let aiMs = 0;
  let findings: { kind: string; text: string }[] = [];
  const done = (outcome: "published" | "held", stage: AutoStage, reason: string, publishedTitle?: string): AutoOutcome =>
    ({ ...base, outcome, stage, reason, findings, kinds: [...new Set(findings.map((f) => f.kind))], publishedTitle, ms: Date.now() - started, aiMs });
  const held = async (stage: AutoStage, reason: string) => {
    await audit(p!, "moderation.auto_hold", "observation", id, { stage, reason, findings: findings.length });
    return done("held", stage, reason);
  };
  if (item.status !== "submitted") return held("received", "Already decided");
  if (!item.consents.publish) return held("received", "The author hasn't given permission to publish");

  let check: Awaited<ReturnType<typeof aiCheck>>;
  const t0 = Date.now();
  try {
    check = await aiCheck(p, id, { title: item.title, body: item.body, mode: "remove" });
  } catch {
    aiMs = Date.now() - t0;
    return held("read", "AIRA was unavailable, so a person needs to read it");
  }
  aiMs = Date.now() - t0;
  // The moderator sees these, as on the review page; the audit row keeps counts only.
  findings = check.findings.map((f) => ({ kind: f.kind, text: f.text }));
  // Nothing identifying: publish the author's own words. Otherwise only AIRA's rewrite, and only if it passed its checks.
  const copy = check.findings.length ? check.rewrite : { title: item.title, body: item.body };
  if (!copy) return held("rewrite", "AIRA's rewrite didn't pass the identifier checks");
  try {
    await publish(p, id, { title: copy.title, body: copy.body });
  } catch (e) {
    return held("checks", e instanceof Error ? e.message : "Publishing was refused");
  }
  await audit(p!, "moderation.auto_publish", "observation", id, { findings: findings.length, rewritten: findings.length > 0 });
  const n = findings.length;
  return done("published", "published", n ? `${n} identifying ${n === 1 ? "detail" : "details"} removed` : "Nothing identifying: published as written", copy.title);
}

// --- Demo only: fill the queue with synthetic contributions from the client banks, to show the autonomous run at scale.


export async function simulateQueue(p: Principal | null, count: number) {
  authorize(p, "moderation.review");
  if (!DEMO_MODE) throw new HttpError(403, "The queue simulator is for demo mode only");
  const n = Math.min(Math.max(Math.trunc(count) || 0, 1), 40);
  const authors = await all<{ user_id: number; org_id: number; slug: string; name: string }>(
    `select m.user_id, m.org_id, o.slug, o.name from memberships m join organisations o on o.id = m.org_id
     where o.kind = 'client' and m.status = 'active' and m.roles like '%client_%' order by m.id`);
  if (!authors.length) throw new HttpError(409, "No client members to write contributions");
  const ids: number[] = [];
  await tx(async () => {
    for (let i = 0; i < n; i++) {
      const a = authors[i % authors.length];
      const s = SAMPLES[i % SAMPLES.length];
      const fill = (t: string) => sampleText(t, a.slug);
      const org = (await all<{ industry: string; region: string }>("select industry, region from organisations where id = ?", a.org_id))[0];
      const at = now();
      const id = await insert(`insert into observations (org_id,author_id,title,body,category,offering,industry,region,period,
        evidence_type,confidence,visibility,status,created_at,updated_at) values (?,?,?,?,?,?,?,?,?,?,?,'community','submitted',?,?)`,
        a.org_id, a.user_id, s.title, fill(s.body), s.category, s.offering, org.industry, org.region, s.period, fill(s.evidence), "Medium", at, at);
      for (const [purpose, granted] of [["store", 1], ["publish", 1], ["attribute", 0], ["train", 0]] as const) {
        await run("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, purpose, granted, a.user_id, at);
      }
      ids.push(id);
    }
    await audit(p!, "moderation.simulate", "observation", null, { count: n });
  });
  return { created: ids.length, ids };
}
