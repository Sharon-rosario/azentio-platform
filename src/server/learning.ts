import "server-only";

import { audit, notify } from "./audit";
import { all, insert, now, one, run, tx } from "./db";
import { authorize, HttpError, type Principal, sameTenant } from "./policy";
import { type Flag, scan } from "./scan";

export const CATEGORIES = ["Market observation", "Emerging trend", "Product gap", "Operational challenge", "Successful practice",
  "Improvement suggestion"] as const;
export const VISIBILITIES = ["private", "organisation", "community"] as const;
export const CONFIDENCE = ["Low", "Medium", "High"] as const;
const PURPOSES = ["store", "publish", "attribute", "train"] as const;

export type Observation = {
  id: number; org_id: number; author_id: number; author: string; title: string; body: string; category: string;
  offering: string; industry: string; region: string; period: string; evidence_type: string; confidence: string;
  visibility: (typeof VISIBILITIES)[number]; status: string; moderator_note: string | null; created_at: string; updated_at: string;
};

export type SharedItem = {
  id: number; title: string; body: string; category: string; offering: string; industry: string; region: string;
  period: string; evidence_type: string; confidence: string; attribution: string | null; theme: string | null;
  version: number; published_at: string; mine: boolean;
};

const OBS_COLS = `o.id, o.org_id, o.author_id, u.name as author, o.title, o.body, o.category, o.offering, o.industry, o.region,
  o.period, o.evidence_type, o.confidence, o.visibility, o.status, o.moderator_note, o.created_at, o.updated_at`;

// ---------------------------------------------------------------- the author's side

/** Mine, or my organisation's (only what colleagues chose to share inside the organisation). Drafts stay private. */
export async function listObservations(p: Principal | null, scope: "mine" | "org") {
  authorize(p, "observations.write");
  if (scope === "mine") {
    return await all<Observation>(`select ${OBS_COLS} from observations o join users u on u.id = o.author_id
      where o.author_id = ? and o.org_id = ? order by o.updated_at desc`, p.userId, p.orgId!);
  }
  authorize(p, "observations.org");
  return await all<Observation>(`select ${OBS_COLS} from observations o join users u on u.id = o.author_id
    where o.org_id = ? and o.visibility in ('organisation','community') and o.status != 'withdrawn' and o.author_id != ?
    order by o.updated_at desc`, p.orgId!, p.userId);
}

export async function getObservation(p: Principal | null, id: number) {
  authorize(p, "observations.write");
  const o = await one<Observation>(`select ${OBS_COLS} from observations o join users u on u.id = o.author_id where o.id = ?`, id);
  if (!o) throw new HttpError(404, "Not found");
  sameTenant(p, o.org_id);
  if (o.author_id !== p.userId && o.visibility === "private") throw new HttpError(404, "Not found");
  const consents = await all<{ purpose: string; granted: number; at: string }>(
    "select purpose, granted, at from consents where observation_id = ? order by id", id);
  const current = Object.fromEntries(PURPOSES.map((k) => [k, !!consents.filter((c) => c.purpose === k).at(-1)?.granted]));
  const shared = await all<{ id: number; version: number; status: string; published_at: string }>(
    "select id, version, status, published_at from shared_versions where observation_id = ? order by version", id);
  return { ...o, mine: o.author_id === p.userId, consents: current, consentHistory: consents, shared, flags: scan(o.title, o.body) };
}

type ObsInput = Partial<Pick<Observation, "title" | "body" | "category" | "offering" | "period" | "evidence_type" | "confidence" | "visibility">>;

function clean(input: ObsInput) {
  const t = (v: unknown, f: string, max: number) => {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) throw new HttpError(422, `${f} is required`);
    if (s.length > max) throw new HttpError(422, `${f} must be under ${max} characters`);
    return s;
  };
  const pick = <T extends string>(v: unknown, f: string, opts: readonly T[]) => {
    if (!opts.includes(v as T)) throw new HttpError(422, `${f} must be one of: ${opts.join(", ")}`);
    return v as T;
  };
  return {
    title: t(input.title, "Title", 140), body: t(input.body, "Observation", 4000),
    category: pick(input.category, "Category", CATEGORIES), offering: t(input.offering, "Offering", 80),
    period: t(input.period, "Observation period", 60), evidence_type: t(input.evidence_type, "Evidence type", 80),
    confidence: pick(input.confidence, "Confidence", CONFIDENCE),
  };
}

/**
 * Saving never shares. Community visibility is set only by submit (which records the author's consent) and left only
 * by withdrawal, so create and edit accept "private" or "organisation", and an item already proposed or published to
 * the community keeps that visibility when edited.
 */
function visibilityFor(requested: unknown, current?: Observation["visibility"]): Observation["visibility"] {
  if (current === "community") return "community";
  const v = requested ?? current ?? "private";
  if (v === "community") throw new HttpError(422, "Propose it for the learning community with Submit, which records your permission");
  if (!VISIBILITIES.includes(v as Observation["visibility"])) throw new HttpError(422, `Visibility must be one of: ${VISIBILITIES.join(", ")}`);
  return v as Observation["visibility"];
}

export async function createObservation(p: Principal | null, input: ObsInput) {
  authorize(p, "observations.write");
  const v = { ...clean(input), visibility: visibilityFor(input.visibility) };
  const org = (await one<{ industry: string; region: string }>("select industry, region from organisations where id = ?", p.orgId!))!;
  return await tx(async () => {
    const id = await insert(`insert into observations (org_id,author_id,title,body,category,offering,industry,region,period,
      evidence_type,confidence,visibility,status,created_at,updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,'draft',?,?)`,
      p.orgId!, p.userId, v.title, v.body, v.category, v.offering, org.industry, org.region, v.period, v.evidence_type,
      v.confidence, v.visibility, now(), now());
    await run("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, "store", 1, p.userId, now());
    await audit(p, "observation.create", "observation", id, { visibility: v.visibility });
    return id;
  });
}

/** Editing a published contribution sends it back for review: a material change never widens an audience silently. */
export async function updateObservation(p: Principal | null, id: number, input: ObsInput) {
  const o = await getObservation(p, id);
  if (!o.mine) throw new HttpError(403, "Only the author can edit this");
  if (!["draft", "returned", "published"].includes(o.status)) throw new HttpError(409, `Can't edit while ${o.status}`);
  const v = { ...clean({ ...o, ...input }), visibility: visibilityFor(input.visibility, o.visibility) };
  const status = o.status === "published" ? "submitted" : o.status === "returned" ? "draft" : o.status;
  await tx(async () => {
    await run(`update observations set title=?,body=?,category=?,offering=?,period=?,evidence_type=?,confidence=?,visibility=?,status=?,
      updated_at=? where id = ?`, v.title, v.body, v.category, v.offering, v.period, v.evidence_type, v.confidence,
      v.visibility, status, now(), id);
    await audit(p!, "observation.edit", "observation", id, { from: o.status, to: status });
  });
}

/** Propose for the shared learning community. Needs the publish consent; attribution and training are separate. */
export async function submitObservation(p: Principal | null, id: number, consents: { publish?: boolean; attribute?: boolean; train?: boolean }) {
  const o = await getObservation(p, id);
  if (!o.mine) throw new HttpError(403, "Only the author can submit this");
  if (!["draft", "returned"].includes(o.status)) throw new HttpError(409, `Already ${o.status}`);
  if (!consents.publish) throw new HttpError(422, "Sharing with the community needs your permission to publish a reviewed copy");
  await tx(async () => {
    for (const purpose of ["publish", "attribute", "train"] as const) {
      await run("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, purpose,
        consents[purpose] ? 1 : 0, p!.userId, now());
    }
    await run("update observations set visibility='community', status='submitted', updated_at=? where id = ?", now(), id);
    await audit(p!, "observation.submit", "observation", id, { consents });
  });
  for (const m of await moderators()) await notify(m, `New contribution to review: ${o.title}`, `/portal/moderation/${id}`);
}

/**
 * Withdraw: the shared copy leaves the feed, search and AIRA in the same transaction (well within the 60 s the brief
 * asks for). Anyone who already read it can't be made to forget it; the UI says so.
 */
export async function withdrawObservation(p: Principal | null, id: number) {
  const o = await getObservation(p, id);
  if (!o.mine) throw new HttpError(403, "Only the author can withdraw this");
  if (o.status === "withdrawn") return;
  await tx(async () => {
    await run("update observations set status='withdrawn', updated_at=? where id = ?", now(), id);
    const ids = (await all<{ id: number }>("select id from shared_versions where observation_id = ? and status != 'withdrawn'", id)).map((r) => r.id);
    await run("update shared_versions set status='withdrawn', withdrawn_at=? where observation_id = ? and status != 'withdrawn'", now(), id);
    // Open reports on these copies are moot: nothing is left to restore, so a moderator can't republish by accident.
    await closeReports(ids, "closed: withdrawn by the author");
    await run("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, "publish", 0, p!.userId, now());
    await invalidateSummaries(ids);
    await audit(p!, "observation.withdraw", "observation", id, { shared_versions: ids });
  });
}

// ---------------------------------------------------------------- moderation

const moderators = async () => (await all<{ user_id: number }>("select user_id from memberships where status='active' and roles like '%moderator%'")).map((r) => r.user_id);

/** Only contributions proposed for sharing reach a moderator. Private and organisation-only drafts never do. */
export async function moderationQueue(p: Principal | null) {
  authorize(p, "moderation.review");
  const items = await all<Observation & { org: string }>(`select ${OBS_COLS}, g.name as org from observations o join users u on u.id = o.author_id
    join organisations g on g.id = o.org_id where o.visibility = 'community' and o.status = 'submitted' order by o.updated_at`);
  const reports = await all<{ id: number; shared_id: number; title: string; reason: string; created_at: string }>(
    `select r.id, r.shared_id, s.title, r.reason, r.created_at from reports r join shared_versions s on s.id = r.shared_id
     where r.status = 'open' order by r.id`);
  return { items: items.map((o) => ({ ...o, flags: scan(o.title, o.body) })), reports };
}

export async function reviewItem(p: Principal | null, id: number) {
  authorize(p, "moderation.review");
  const o = await one<Observation & { org: string }>(`select ${OBS_COLS}, g.name as org from observations o join users u on u.id = o.author_id
    join organisations g on g.id = o.org_id where o.id = ? and o.visibility = 'community' and o.status in ('submitted','published')`, id);
  if (!o) throw new HttpError(404, "Not found");
  const consent = async (k: string) => !!(await one<{ granted: number }>(
    "select granted from consents where observation_id = ? and purpose = ? order by id desc limit 1", id, k))?.granted;
  return { ...o, flags: scan(o.title, o.body), consents: { publish: await consent("publish"), attribute: await consent("attribute"), train: await consent("train") } };
}

type PublishInput = { title?: string; body?: string; period?: string; region?: string; theme_id?: number | null; attribute?: boolean };

/** Publish a reviewed copy: a new row with only the reviewed fields. Refused while the copy still looks sensitive. */
export async function publish(p: Principal | null, id: number, input: PublishInput) {
  const o = await reviewItem(p, id);
  if (o.status !== "submitted") throw new HttpError(409, "Already published");
  if (!o.consents.publish) throw new HttpError(409, "The author hasn't given permission to publish");
  const title = (input.title ?? o.title).trim();
  const bodyText = (input.body ?? o.body).trim();
  const flags: Flag[] = scan(title, bodyText);
  if (flags.length) throw new HttpError(422, `Redact before publishing: ${flags.map((f) => `${f.kind} "${f.match}"`).join(", ")}`);
  if (input.theme_id != null && !await one("select id from themes where id = ?", input.theme_id)) throw new HttpError(422, "Unknown theme");
  const attribution = input.attribute && o.consents.attribute ? o.org : null; // opt-in by the author AND the moderator
  await tx(async () => {
    const version = ((await one<{ v: number }>("select coalesce(max(version),0)::int as v from shared_versions where observation_id = ?", id))?.v ?? 0) + 1;
    // Every earlier live or reported copy is replaced, so a reported old version can't later be restored beside this one.
    const replaced = (await all<{ id: number }>("select id from shared_versions where observation_id = ? and status in ('published','under_review')", id)).map((r) => r.id);
    await run("update shared_versions set status='superseded' where observation_id = ? and status in ('published','under_review')", id);
    await closeReports(replaced, "closed: superseded by a newer reviewed copy");
    await invalidateSummaries(replaced);
    const sid = await insert(`insert into shared_versions (observation_id,version,title,body,category,offering,industry,region,period,
      evidence_type,confidence,attribution,theme_id,published_by,published_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, version, title, bodyText, o.category, o.offering, o.industry, (input.region ?? o.region).trim(),
      (input.period ?? o.period).trim(), o.evidence_type, o.confidence, attribution, input.theme_id ?? null, p!.userId, now());
    await run("update observations set status='published', moderator_note=null, updated_at=? where id = ?", now(), id);
    await audit(p!, "moderation.publish", "observation", id, { shared_version: sid, version, attribution: !!attribution,
      edited: title !== o.title || bodyText !== o.body });
    await notify(o.author_id, `Your contribution "${o.title}" was published to the learning community`, `/portal/observations/${id}`);
  });
}

export async function sendBack(p: Principal | null, id: number, decision: "return" | "reject", note: string) {
  const o = await reviewItem(p, id);
  if (o.status !== "submitted") throw new HttpError(409, "Not waiting for review");
  if (note.trim().length < 5) throw new HttpError(422, "Tell the author why (at least 5 characters)");
  const status = decision === "return" ? "returned" : "rejected";
  await tx(async () => {
    await run("update observations set status=?, moderator_note=?, updated_at=? where id = ?", status, note.trim(), now(), id);
    await audit(p!, `moderation.${decision}`, "observation", id, { note: note.trim() });
    await notify(o.author_id, decision === "return" ? `"${o.title}" needs a change before it can be shared` : `"${o.title}" wasn't published`,
      `/portal/observations/${id}`);
  });
}

// ---------------------------------------------------------------- shared learning

export type Filters = { q?: string; offering?: string; industry?: string; region?: string; category?: string };

/** The cross-client feed: published copies only, safe columns only. No tenant id, author or notes in the payload. */
export async function sharedFeed(p: Principal | null, f: Filters = {}): Promise<SharedItem[]> {
  authorize(p, "shared.read");
  const where = ["s.status = 'published'"];
  const args: string[] = [];
  if (f.q) { where.push("(s.title like ? or s.body like ?)"); args.push(`%${f.q}%`, `%${f.q}%`); }
  for (const k of ["offering", "industry", "region", "category"] as const) {
    if (f[k]) { where.push(`s.${k} = ?`); args.push(f[k]!); }
  }
  return (await all<SharedItem & { author_id: number }>(`select s.id, s.title, s.body, s.category, s.offering, s.industry, s.region, s.period,
    s.evidence_type, s.confidence, s.attribution, t.name as theme, s.version, s.published_at, o.author_id
    from shared_versions s join observations o on o.id = s.observation_id left join themes t on t.id = s.theme_id
    where ${where.join(" and ")} order by s.published_at desc`, ...args))
    .map(({ author_id, ...s }) => ({ ...s, mine: author_id === p.userId }));
}

export async function feedFacets(p: Principal | null) {
  authorize(p, "shared.read");
  const col = async (c: string) => (await all<{ v: string }>(`select distinct ${c} as v from shared_versions where status='published' order by 1`)).map((r) => r.v);
  return { offering: await col("offering"), industry: await col("industry"), region: await col("region"), category: await col("category") };
}

/** Report: temporarily unpublished while a moderator looks. The reporter's identity isn't shown to other clients. */
export async function report(p: Principal | null, sharedId: number, reason: string) {
  authorize(p, "reports.create");
  const s = await one<{ id: number; title: string }>("select id, title from shared_versions where id = ? and status = 'published'", sharedId);
  if (!s) throw new HttpError(404, "Not found");
  if (reason.trim().length < 5) throw new HttpError(422, "Say what's wrong (at least 5 characters)");
  await tx(async () => {
    const id = await insert("insert into reports (shared_id,reporter_id,reason,created_at) values (?,?,?,?)", sharedId, p.userId,
      reason.trim(), now());
    await run("update shared_versions set status='under_review' where id = ?", sharedId);
    await invalidateSummaries([sharedId]);
    await audit(p, "shared.report", "shared_version", sharedId, { report: id });
  });
  for (const m of await moderators()) await notify(m, `Reported for review: ${s.title}`, "/portal/moderation");
}

export async function decideReport(p: Principal | null, reportId: number, decision: "restore" | "remove", note: string) {
  authorize(p, "reports.decide");
  const r = await one<{ id: number; shared_id: number; status: string; shared_status: string }>(
    "select r.id, r.shared_id, r.status, s.status as shared_status from reports r join shared_versions s on s.id = r.shared_id where r.id = ?", reportId);
  if (!r || r.status !== "open") throw new HttpError(404, "Not found");
  // Only a copy still held for this review can be restored; a withdrawn or replaced copy must stay down.
  if (r.shared_status !== "under_review") throw new HttpError(409, "This copy was withdrawn or replaced, so it can't be restored");
  await tx(async () => {
    await run("update reports set status='closed', decision=? where id = ?", `${decision}: ${note.trim()}`, reportId);
    await run("update shared_versions set status=?, withdrawn_at=? where id = ?", decision === "restore" ? "published" : "withdrawn",
      decision === "remove" ? now() : null, r.shared_id);
    await audit(p, `report.${decision}`, "shared_version", r.shared_id, { report: reportId, note: note.trim() });
    const author = (await one<{ author_id: number; title: string }>(
      "select o.author_id, s.title from shared_versions s join observations o on o.id = s.observation_id where s.id = ?", r.shared_id))!;
    await notify(author.author_id, decision === "restore" ? `"${author.title}" was reviewed and is visible again`
      : `"${author.title}" was removed after a report`, "/portal/observations");
  });
}

/** Close the open reports on these copies with a recorded reason (called inside the caller's transaction). */
async function closeReports(sharedIds: number[], decision: string) {
  for (const sid of sharedIds) await run("update reports set status='closed', decision=? where shared_id = ? and status = 'open'", decision, sid);
}

/** Any AIRA summary that cited these copies is cleared, so withdrawn or reported material can't live on in it. */
export async function invalidateSummaries(sharedIds: number[]) {
  if (!sharedIds.length) return;
  for (const t of await all<{ id: number; summary_citations: string | null }>("select id, summary_citations from themes where summary is not null")) {
    const cited: number[] = JSON.parse(t.summary_citations ?? "[]").map((c: { shared_id: number }) => c.shared_id);
    if (cited.some((id) => sharedIds.includes(id))) {
      await run("update themes set summary=null, summary_citations=null, summary_at=null where id = ?", t.id);
    }
  }
}
