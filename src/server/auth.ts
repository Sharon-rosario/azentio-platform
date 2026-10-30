import "server-only";

import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";

import { audit } from "./audit";
import { all, insert, now, one, run, tx } from "./db";
import { HttpError, permsFor, type Principal, type Role } from "./policy";
import { isIdle, needsTouch, SESSION_HOURS } from "./session-policy";

// __Host- prefix in production: the browser only accepts it over HTTPS, host-only, path=/ (no subdomain can set it).
export const COOKIE = process.env.NODE_ENV === "production" ? "__Host-azp_session" : "azp_session";
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
/**
 * Demo mode shows sign-in codes for the synthetic demo personas on screen (there is no email provider). It is on in
 * development and must be switched on explicitly in production (DEMO_MODE=1), e.g. for a judging environment.
 */
export const DEMO_MODE = process.env.DEMO_MODE === "1" || (process.env.NODE_ENV !== "production" && process.env.DEMO_MODE !== "0");

/** HMAC key for login codes. Required in production; generated once into data/ for local development. */
function secret(): string {
  if (process.env.SESSION_SECRET) {
    if (process.env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required in production");
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const file = join(process.cwd(), "data", "secret");
  if (!existsSync(file)) writeFileSync(file, randomBytes(32).toString("hex"));
  return readFileSync(file, "utf8").trim();
}

const hash = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
const normalise = (email: string) => email.trim().toLowerCase();

/** Email a one-time code. The response never says whether the address has an account. */
export async function requestCode(rawEmail: string) {
  const email = normalise(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(422, "Enter a valid email address");
  const recent = await one<{ n: number }>("select count(*)::int as n from login_codes where email = ? and expires_at > ?", email,
    new Date(Date.now() - 15 * 60_000).toISOString());
  if ((recent?.n ?? 0) >= (DEMO_MODE ? 30 : 5)) throw new HttpError(429, "Too many codes requested. Try again in 15 minutes");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await tx(async () => {
    await run("insert into login_codes (email,code_hash,expires_at) values (?,?,?)", email, hash(`${email}:${code}`),
      new Date(Date.now() + CODE_MINUTES * 60_000).toISOString());
    await run("insert into outbox (to_email,subject,body,created_at) values (?,?,?,?)", email, "Your azentio.ai sign-in code",
      `Your code is ${code}. It expires in ${CODE_MINUTES} minutes and works once.`, now());
  });
}

/** Check the code and start a session. A new address gets a user with no memberships: no tenant is trusted by default. */
export async function verifyCode(rawEmail: string, code: string) {
  const email = normalise(rawEmail);
  const row = await one<{ id: number; code_hash: string; attempts: number }>(
    "select id, code_hash, attempts from login_codes where email = ? and used_at is null and expires_at > ? order by id desc limit 1",
    email, now());
  if (!row) throw new HttpError(400, "That code has expired. Ask for a new one");
  if (row.attempts >= MAX_ATTEMPTS) throw new HttpError(429, "Too many wrong attempts. Ask for a new code");
  const expected = Buffer.from(row.code_hash, "hex");
  const given = Buffer.from(hash(`${email}:${code.trim()}`), "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await run("update login_codes set attempts = attempts + 1 where id = ?", row.id);
    throw new HttpError(400, "That code isn't right");
  }
  const sid = randomBytes(32).toString("base64url");
  const userId = await tx(async () => {
    await run("update login_codes set used_at = ? where id = ?", now(), row.id);
    let user = await one<{ id: number }>("select id from users where email = ?", email);
    if (!user) {
      const id = await insert("insert into users (email,name,created_at) values (?,?,?)", email, email.split("@")[0], now());
      user = { id };
    }
    const first = await one<{ id: number }>("select id from memberships where user_id = ? and status = 'active' order by id limit 1", user.id);
    await run("insert into sessions (id,user_id,membership_id,created_at,expires_at,last_seen_at) values (?,?,?,?,?,?)",
      createHash("sha256").update(sid).digest("hex"), user.id, first?.id ?? null, now(),
      new Date(Date.now() + SESSION_HOURS * 3_600_000).toISOString(), now());
    await audit({ actorId: user.id, actor: email }, "auth.sign_in", "user", user.id);
    return user.id;
  });
  (await cookies()).set(COOKIE, sid, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_HOURS * 3600,
  });
  return userId;
}

export async function signOut() {
  const store = await cookies();
  const sid = store.get(COOKIE)?.value;
  if (sid) await run("delete from sessions where id = ?", createHash("sha256").update(sid).digest("hex"));
  store.delete(COOKIE);
}

/** The signed-in person and their active workspace, reloaded from the database on every request. */
export async function getPrincipal(): Promise<Principal | null> {
  const sid = (await cookies()).get(COOKIE)?.value;
  if (!sid) return null;
  const key = createHash("sha256").update(sid).digest("hex");
  const session = await one<{ user_id: number; membership_id: number | null; created_at: string; last_seen_at: string | null }>(
    "select user_id, membership_id, created_at, last_seen_at from sessions where id = ? and expires_at > ?", key, now());
  if (!session) return null;
  // Idle timeout: a session unused for too long is ended on the server, not just hidden in the browser.
  const lastSeen = session.last_seen_at ?? session.created_at;
  const t = Date.now();
  if (isIdle(lastSeen, t)) {
    await run("delete from sessions where id = ?", key);
    return null;
  }
  if (needsTouch(lastSeen, t)) await run("update sessions set last_seen_at = ? where id = ?", now(), key);
  const user = (await one<{ id: number; email: string; name: string }>("select id, email, name from users where id = ?", session.user_id))!;
  const memberships = (await all<{ id: number; org_id: number; name: string; kind: string; roles: string }>(
    `select m.id, m.org_id, o.name, o.kind, m.roles from memberships m join organisations o on o.id = m.org_id
     where m.user_id = ? and m.status = 'active' order by m.id`, user.id)).map((m) => ({
    id: m.id, orgId: m.org_id, orgName: m.name, kind: m.kind, roles: m.roles.split(",") as Role[],
  }));
  // A revoked or removed membership stops working immediately, even mid-session.
  const active = memberships.find((m) => m.id === session.membership_id) ?? null;
  return {
    userId: user.id, email: user.email, name: user.name,
    membershipId: active?.id ?? null, orgId: active?.orgId ?? null, orgName: active?.orgName ?? null,
    orgKind: (active?.kind as Principal["orgKind"]) ?? null,
    roles: active?.roles ?? [], perms: permsFor(active?.roles ?? []), memberships,
  };
}

/** Switch workspace: only to a membership the user really holds. */
export async function switchWorkspace(p: Principal, membershipId: number) {
  const m = p.memberships.find((x) => x.id === membershipId);
  if (!m) throw new HttpError(404, "Not found");
  const sid = (await cookies()).get(COOKIE)?.value;
  if (!sid) throw new HttpError(401, "Sign in first");
  await run("update sessions set membership_id = ? where id = ?", m.id, createHash("sha256").update(sid).digest("hex"));
  await audit(p, "auth.switch_workspace", "membership", m.id, { org: m.orgName });
}
