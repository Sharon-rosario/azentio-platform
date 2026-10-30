import "server-only";

import { PRODUCT_NAME } from "@/lib/products";

import { audit } from "./audit";
import { all, insert, now, one, tx } from "./db";
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
  if (typeof input.title !== "string" || typeof input.summary !== "string" || !input.title.trim() || !input.summary.trim()) {
    throw new HttpError(422, "Title and summary are required");
  }
  if (input.product != null && (typeof input.product !== "string" || !(input.product in PRODUCT_NAME))) throw new HttpError(422, "Unknown product");
  if (input.starts_at != null && (typeof input.starts_at !== "string" || Number.isNaN(Date.parse(input.starts_at)))) {
    throw new HttpError(422, "Start time must be a date");
  }
  return await tx(async () => {
    const id = await insert("insert into content (kind,title,summary,audience,product,starts_at,created_at) values (?,?,?,?,?,?,?)",
      input.kind, input.title.trim(), input.summary.trim(), input.audience, input.product || null, input.starts_at || null, now());
    await audit(p, "content.create", "content", id, { audience: input.audience, kind: input.kind });
    return id;
  });
}

/** Public forms: demo requests and hackathon registration. Stored, never auto-confirmed by email. */
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
// Public forms: per source and per address, over a rolling window. Only stored requests count.
const REQUEST_WINDOW_MINUTES = 15;
const REQUESTS_PER_SOURCE = 5;
const REQUESTS_PER_EMAIL = 3;

export async function createRequest(kind: "demo" | "hackathon", input: { name?: unknown; email?: unknown; company?: unknown; message?: unknown },
  sourceHash: string) {
  const name = str(input.name);
  const email = str(input.email).toLowerCase();
  const message = str(input.message);
  if (name.length < 2 || name.length > 120) throw new HttpError(422, "Enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new HttpError(422, "Enter a valid email address");
  if (message.length > 2000) throw new HttpError(422, "Message must be under 2000 characters");
  if (str(input.company).length > 200) throw new HttpError(422, "Company must be under 200 characters");
  const since = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60_000).toISOString();
  const recent = await one<{ bySource: number; byEmail: number }>(
    `select count(*) filter (where source_hash = ?)::int as "bySource", count(*) filter (where email = ?)::int as "byEmail"
     from requests where created_at > ?`, sourceHash, email, since);
  if ((recent?.bySource ?? 0) >= REQUESTS_PER_SOURCE || (recent?.byEmail ?? 0) >= REQUESTS_PER_EMAIL) {
    throw new HttpError(429, `Too many requests. Try again in ${REQUEST_WINDOW_MINUTES} minutes`);
  }
  return await tx(async () => {
    const id = await insert("insert into requests (kind,name,email,company,message,created_at,source_hash) values (?,?,?,?,?,?,?)",
      kind, name, email, str(input.company) || null, message || null, now(), sourceHash);
    await audit({ actor: email }, `request.${kind}`, "request", id);
    return id;
  });
}
