import "server-only";

import { audit } from "./audit";
import { all, insert, now, one } from "./db";
import { authorize, canSeeContent, HttpError, type Principal } from "./policy";

export type Content = {
  id: number; kind: string; slug: string | null; title: string; summary: string; body: string; audience: string;
  product: string | null; starts_at: string | null; created_at: string;
};

export async function entitlements(p: Principal | null): Promise<Set<string>> {
  if (!p?.orgId) return new Set();
  return new Set((await all<{ product: string }>("select product from entitlements where org_id = ?", p.orgId)).map((r) => r.product));
}

/** Content the principal may see. Filtering happens here, on the server, never in the page. */
export async function listContent(p: Principal | null, kind?: string): Promise<Content[]> {
  const rows = kind
    ? await all<Content>("select * from content where kind = ? order by coalesce(starts_at, created_at) desc", kind)
    : await all<Content>("select * from content order by coalesce(starts_at, created_at) desc");
  const entitled = await entitlements(p);
  return rows.filter((c) => canSeeContent(p, c, entitled));
}

export async function getContent(p: Principal | null, slugOrId: string): Promise<Content> {
  const c = await one<Content>("select * from content where slug = ? or id::text = ?", slugOrId, slugOrId);
  // Not visible looks the same as not there, so private content can't be discovered by guessing URLs.
  if (!c || !canSeeContent(p, c, await entitlements(p))) throw new HttpError(404, "Not found");
  return c;
}

export async function createContent(p: Principal | null, input: { kind: string; title: string; summary: string;
  audience: string; product?: string | null; starts_at?: string | null }) {
  authorize(p, "content.publish");
  if (!["broadcast", "insight", "experiment", "demo"].includes(input.kind)) throw new HttpError(422, "Unknown content type");
  if (!["public", "employee", "client"].includes(input.audience)) throw new HttpError(422, "Choose who can see it");
  if (!input.title?.trim() || !input.summary?.trim()) throw new HttpError(422, "Title and summary are required");
  const id = await insert("insert into content (kind,title,summary,audience,product,starts_at,created_at) values (?,?,?,?,?,?,?)",
    input.kind, input.title.trim(), input.summary.trim(), input.audience, input.product || null, input.starts_at || null, now());
  await audit(p, "content.create", "content", id, { audience: input.audience, kind: input.kind });
  return id;
}

/** Public forms: demo requests and hackathon registration. Stored, never auto-confirmed by email. */
export async function createRequest(kind: "demo" | "hackathon", input: { name?: string; email?: string; company?: string; message?: string }) {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  if (name.length < 2 || name.length > 120) throw new HttpError(422, "Enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(422, "Enter a valid email address");
  if ((input.message ?? "").length > 2000) throw new HttpError(422, "Message must be under 2000 characters");
  const id = await insert("insert into requests (kind,name,email,company,message,created_at) values (?,?,?,?,?,?)",
    kind, name, email, input.company?.trim() || null, input.message?.trim() || null, now());
  await audit({ actor: email }, `request.${kind}`, "request", id);
  return id;
}
