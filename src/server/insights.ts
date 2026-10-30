import "server-only";

import { z } from "zod";

import { audit, notify } from "./audit";
import { all, insert, now, one, run, tx } from "./db";
import { verbatim } from "./evidence";
import { parse } from "./llm";
import { oneOf, text } from "./http";
import { authorize, can, HttpError, type Principal } from "./policy";
import { PRODUCT_NAME } from "@/lib/products";

/** Shared trend statistics need at least this many distinct contributing organisations (configurable). */
export const MIN_ORGS = Number(process.env.MIN_ORGS ?? 3);

export const IDEA_STATUSES = ["Proposed", "Under review", "Planned", "In progress", "Released", "Not proceeding"] as const;

export type Theme = {
  id: number; name: string; offering: string; description: string; suppressed: boolean;
  orgs: number | null; contributions: number | null; period: string | null;
  evidence: { id: number; title: string; body: string; industry: string; region: string; period: string; attribution: string | null }[];
  summary: string | null; citations: { shared_id: number; quote: string }[]; summary_at: string | null; summary_model: string | null;
  ideas: { id: number; title: string; status: string }[];
};

/**
 * Themes over published copies only. Distinct organisations are counted on the server (repeat posts from one
 * organisation are one voice). Below the threshold a theme is suppressed: no counts, no evidence, no summary, except
 * for moderators, who need to see it forming.
 */
export async function listThemes(p: Principal | null): Promise<Theme[]> {
  authorize(p, "themes.read");
  const themes = await all<{ id: number; name: string; offering: string; description: string; summary: string | null;
    summary_citations: string | null; summary_at: string | null; summary_model: string | null }>("select * from themes order by id");
  return Promise.all(themes.map(async (t) => {
    const evidence = await all<Theme["evidence"][number] & { org_id: number }>(`select s.id, s.title, s.body, s.industry, s.region, s.period,
      s.attribution, o.org_id from shared_versions s join observations o on o.id = s.observation_id
      where s.theme_id = ? and s.status = 'published' order by s.published_at`, t.id);
    const orgs = new Set(evidence.map((e) => e.org_id)).size;
    const suppressed = orgs < MIN_ORGS && !can(p, "themes.counts");
    const ideas = (await all<{ id: number; title: string; status: string; internal: number }>(
      "select id, title, status, internal from ideas where theme_id = ? order by id", t.id))
      .filter((i) => !i.internal || can(p, "content.employee")).map(({ internal: _i, ...i }) => i);
    return {
      id: t.id, name: t.name, offering: t.offering, description: t.description, suppressed,
      orgs: suppressed ? null : orgs, contributions: suppressed ? null : evidence.length,
      period: suppressed || !evidence.length ? null : [...new Set(evidence.map((e) => e.period))].join(", "),
      evidence: suppressed ? [] : evidence.map(({ org_id: _o, ...e }) => e),
      summary: suppressed ? null : t.summary,
      citations: suppressed ? [] : JSON.parse(t.summary_citations ?? "[]"),
      summary_at: suppressed ? null : t.summary_at, summary_model: suppressed ? null : t.summary_model,
      ideas,
    };
  }));
}

const Summary = z.object({
  summary: z.string().describe("3-5 sentences on what the contributions have in common and what they suggest, in plain words"),
  limitations: z.string().describe("One sentence on what this small sample can't show (it isn't proof of market prevalence)"),
  citations: z.array(z.object({
    shared_id: z.number().describe("The id of the contribution the quote comes from"),
    quote: z.string().describe("Exact words copied from that contribution, at least 5 words"),
  })).describe("At least one quote per contribution you relied on"),
});

const SYSTEM = `You are AIRA, Azentio's insight assistant. You summarise approved, de-identified market observations from clients
for product teams. Use only the contributions given. Never guess which organisation wrote what, never add facts, and say how
small the sample is. Every point must be backed by a quote copied word for word from a contribution.`;

/** AIRA: summarise a theme from approved shared copies only; every quote is checked against its source. */
export async function synthesize(p: Principal | null, themeId: number) {
  authorize(p, "themes.synthesize");
  const theme = (await listThemes(p)).find((t) => t.id === themeId);
  if (!theme) throw new HttpError(404, "Not found");
  if ((theme.orgs ?? 0) < MIN_ORGS) {
    throw new HttpError(409, `Needs contributions from at least ${MIN_ORGS} organisations before it can be summarised`);
  }
  const sources = theme.evidence.map((e) => `<contribution id="${e.id}">\n${e.title}\n${e.body}\n(period: ${e.period})\n</contribution>`);
  const res = await parse(`Theme: ${theme.name}\n\n${sources.join("\n\n")}\n\nSummarise this theme.`, Summary, SYSTEM);
  if (!res.data) throw new HttpError(502, res.note ?? "AIRA couldn't summarise this");
  const byId = new Map(theme.evidence.map((e) => [e.id, `${e.title} ${e.body}`]));
  // Keep a citation only when its words are in the source, and save the source's own words, not the model's.
  const kept = res.data.citations.flatMap((c) => {
    const quote = byId.has(c.shared_id) ? verbatim(c.quote, byId.get(c.shared_id)!) : null;
    return quote ? [{ shared_id: c.shared_id, quote }] : [];
  });
  const dropped = res.data.citations.length - kept.length;
  if (!kept.length) throw new HttpError(502, "AIRA's summary couldn't be backed by the contributions, so it wasn't saved");
  const summary = `${res.data.summary}\n\nLimitations: ${res.data.limitations}`;
  const read = theme.evidence.map((e) => e.id).sort((a, b) => a - b).join(",");
  await tx(async () => {
    // The model call takes a while. Lock the theme (withdrawals lock it too), then save only if the evidence AIRA read
    // is still exactly what's published: a copy withdrawn or reported meanwhile mustn't live on in the summary.
    await one("select id from themes where id = ? for update", themeId);
    const live = (await all<{ id: number }>("select id from shared_versions where theme_id = ? and status = 'published' order by id", themeId))
      .map((r) => r.id).join(",");
    if (live !== read) throw new HttpError(409, "A contribution changed while AIRA was reading. Summarise again");
    await run("update themes set summary=?, summary_citations=?, summary_at=?, summary_model=? where id = ?", summary,
      JSON.stringify(kept), now(), res.model, themeId);
    await audit(p!, "aira.summarise", "theme", themeId, { sources: theme.evidence.map((e) => e.id), citations: kept.length, unverified_dropped: dropped });
  });
  return { summary, citations: kept, dropped };
}

// ---------------------------------------------------------------- improvement ideas

export type Idea = {
  id: number; title: string; offering: string; status: string; owner: string; public_note: string | null; updated_at: string;
  theme: string | null; problem?: string; proposed_outcome?: string; priority?: string; internal?: boolean;
};

/** Clients see published ideas only, with the plain-language status and public note; internal fields and suggestions stay with employees. */
export async function listIdeas(p: Principal | null): Promise<Idea[]> {
  authorize(p, "ideas.read");
  const internal = can(p, "content.employee");
  const rows = await all<Omit<Idea, "internal"> & { theme_id: number | null; internal: number }>(`select i.*, t.name as theme from ideas i
    left join themes t on t.id = i.theme_id ${internal ? "" : "where i.internal = 0"} order by i.updated_at desc`);
  return rows.map((r) => internal ? { ...r, internal: r.internal === 1 } : {
    id: r.id, title: r.title, offering: r.offering, status: r.status, owner: r.owner, public_note: r.public_note,
    updated_at: r.updated_at, theme: r.theme,
  });
}

/** An employee suggests an improvement. Internal until a product owner publishes it; suggesting is not deciding. */
export async function suggestIdea(p: Principal | null, input: Record<string, unknown>) {
  authorize(p, "ideas.suggest");
  const title = text(input.title, "Title", { min: 3, max: 160 });
  const problem = text(input.problem, "What you've seen", { min: 10, max: 2000 });
  const offering = oneOf(input.offering, "Product", Object.keys(PRODUCT_NAME));
  let themeId: number | null = null;
  if (input.theme_id != null) {
    const theme = (await listThemes(p)).find((t) => t.id === input.theme_id);
    if (!theme || theme.suppressed) throw new HttpError(422, "Link it to a theme with enough evidence, or to none");
    themeId = theme.id;
  }
  const owners = (await all<{ user_id: number }>("select user_id from memberships where status='active' and roles like '%product_owner%'"))
    .map((r) => r.user_id);
  return await tx(async () => {
    const id = await insert(`insert into ideas (title,problem,offering,theme_id,proposed_outcome,owner,priority,status,internal,created_by,
      created_at,updated_at) values (?,?,?,?,'','Unassigned','Medium','Proposed',1,?,?,?)`, title, problem, offering, themeId, p!.userId, now(), now());
    await audit(p!, "idea.suggest", "idea", id, { theme: themeId });
    for (const o of owners) await notify(o, `New improvement suggestion from ${p!.name}: ${title}`, "/portal/ideas");
    return id;
  });
}

/** A product owner shows an internal suggestion to clients. It needs a theme with enough evidence, like any idea. */
export async function publishIdea(p: Principal | null, id: number, themeId?: unknown) {
  authorize(p, "ideas.write");
  const idea = await one<{ id: number; internal: number; theme_id: number | null }>("select id, internal, theme_id from ideas where id = ?", id);
  if (!idea) throw new HttpError(404, "Not found");
  if (!idea.internal) throw new HttpError(409, "Clients can already see this idea");
  const target = idea.theme_id ?? (typeof themeId === "number" ? themeId : null);
  const theme = target === null ? undefined : (await listThemes(p)).find((t) => t.id === target);
  if (!theme || theme.suppressed) throw new HttpError(422, "Link it to a theme with enough evidence before clients see it");
  await tx(async () => {
    await run("update ideas set internal = 0, theme_id = ?, updated_at = ? where id = ?", theme.id, now(), id);
    await audit(p!, "idea.publish", "idea", id, { theme: theme.id });
  });
}

export async function createIdea(p: Principal | null, input: { title: string; problem: string; offering: string; theme_id: number;
  proposed_outcome: string; owner: string; priority: string }) {
  authorize(p, "ideas.write");
  const theme = (await listThemes(p)).find((t) => t.id === Number(input.theme_id));
  if (!theme || theme.suppressed) throw new HttpError(422, "Link the idea to a theme with enough evidence");
  for (const k of ["title", "problem", "proposed_outcome", "owner"] as const) {
    if (typeof input[k] !== "string" || !input[k].trim()) throw new HttpError(422, `${k.replace("_", " ")} is required`);
  }
  if (input.priority != null && !["Low", "Medium", "High"].includes(input.priority)) throw new HttpError(422, "Priority must be Low, Medium or High");
  return await tx(async () => {
    const id = await insert(`insert into ideas (title,problem,offering,theme_id,proposed_outcome,owner,priority,status,created_by,created_at,updated_at)
      values (?,?,?,?,?,?,?,'Proposed',?,?,?)`, input.title.trim(), input.problem.trim(), theme.offering, theme.id,
      input.proposed_outcome.trim(), input.owner.trim(), input.priority || "Medium", p!.userId, now(), now());
    await audit(p!, "idea.create", "idea", id, { theme: theme.id });
    return id;
  });
}

/** Status changes are audited and reach the contributors behind the theme, without internal detail. */
export async function updateIdeaStatus(p: Principal | null, id: number, status: string, publicNote: string) {
  authorize(p, "ideas.write");
  if (!IDEA_STATUSES.includes(status as (typeof IDEA_STATUSES)[number])) throw new HttpError(422, "Unknown status");
  if (typeof publicNote !== "string") throw new HttpError(422, "The public note must be text");
  const idea = await one<{ id: number; title: string; status: string; theme_id: number | null; internal: number }>(
    "select id, title, status, theme_id, internal from ideas where id = ?", id);
  if (!idea) throw new HttpError(404, "Not found");
  await tx(async () => {
    await run("update ideas set status=?, public_note=?, updated_at=? where id = ?", status, publicNote.trim() || null, now(), id);
    await audit(p!, "idea.status", "idea", id, { from: idea.status, to: status });
    if (idea.theme_id && !idea.internal) { // an internal suggestion reaches no client
      const authors = await all<{ author_id: number }>(`select distinct o.author_id from shared_versions s join observations o on o.id = s.observation_id
        where s.theme_id = ? and s.status = 'published'`, idea.theme_id);
      for (const a of authors) await notify(a.author_id, `An improvement linked to your contribution is now "${status}": ${idea.title}`, "/portal/ideas");
    }
  });
}
