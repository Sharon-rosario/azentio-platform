import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { AUDIT_LOCK, GENESIS, rowHash, type AuditFields } from "./audit-chain";
import { seed } from "./seed";

// Postgres everywhere. Locally: PGlite (Postgres compiled to WASM, in-process, a folder in data/, no install).
// Deployed (Vercel): Supabase or any Postgres via DATABASE_URL. Same SQL in both. `npm run reset` wipes the local copy.

type Exec = (sql: string, params: unknown[]) => Promise<Record<string, unknown>[]>;
type Driver = { exec: Exec; transaction: <T>(fn: (exec: Exec) => Promise<T>) => Promise<T>; script: (sql: string) => Promise<void> };

const SCHEMA = `
create table if not exists organisations (
  id serial primary key, slug text unique not null, name text not null,
  kind text not null check (kind in ('internal','client')), industry text, region text
);
create table if not exists users (
  id serial primary key, email text unique not null, name text not null, created_at text not null
);
-- A person can belong to several organisations; each membership carries its own roles.
create table if not exists memberships (
  id serial primary key, user_id int not null references users(id), org_id int not null references organisations(id),
  roles text not null, status text not null default 'active' check (status in ('active','revoked')),
  created_at text not null, unique (user_id, org_id)
);
create table if not exists entitlements (org_id int not null references organisations(id), product text not null,
  primary key (org_id, product));
create table if not exists sessions (
  id text primary key, user_id int not null references users(id), membership_id int references memberships(id),
  created_at text not null, expires_at text not null
);
-- Idle timeout (added after first deploy): idempotent, so existing databases gain the column on the next start.
alter table sessions add column if not exists last_seen_at text;
create table if not exists login_codes (
  id serial primary key, email text not null, code_hash text not null, expires_at text not null,
  attempts int not null default 0, used_at text
);
create table if not exists invitations (
  id serial primary key, org_id int not null references organisations(id), email text not null, role text not null,
  token_hash text not null, invited_by int not null references users(id), created_at text not null,
  expires_at text not null, accepted_at text, revoked_at text
);
-- Mail that would be sent. Never labelled delivered: there is no provider in the demo.
create table if not exists outbox (
  id serial primary key, to_email text not null, subject text not null, body text not null, created_at text not null
);
create table if not exists content (
  id serial primary key, kind text not null, slug text unique, title text not null, summary text not null,
  body text not null default '', audience text not null check (audience in ('public','employee','client')),
  product text, media_url text, starts_at text, created_at text not null
);
create table if not exists requests (
  id serial primary key, kind text not null, name text not null, email text not null, company text,
  message text, created_at text not null
);
-- Rate limiting for the public forms (added after first deploy): a keyed hash of the source, never the raw IP.
alter table requests add column if not exists source_hash text;
-- The private source. Never returned to anyone outside its author/organisation scope.
create table if not exists observations (
  id serial primary key, org_id int not null references organisations(id), author_id int not null references users(id),
  title text not null, body text not null, category text not null, offering text not null, industry text not null,
  region text not null, period text not null, evidence_type text not null, confidence text not null,
  visibility text not null default 'private' check (visibility in ('private','organisation','community')),
  status text not null default 'draft' check (status in ('draft','submitted','returned','published','rejected','withdrawn')),
  moderator_note text, created_at text not null, updated_at text not null
);
-- Consent per purpose, append-only: storing, publishing a shared copy, attribution, future training are separate.
create table if not exists consents (
  id serial primary key, observation_id int not null references observations(id), purpose text not null,
  granted int not null, actor_id int not null references users(id), at text not null
);
create table if not exists themes (
  id serial primary key, name text not null, offering text not null, description text not null,
  summary text, summary_citations text, summary_at text, summary_model text
);
-- The shared representation: only reviewed fields. No tenant id, no author, no notes leave through this table.
create table if not exists shared_versions (
  id serial primary key, observation_id int not null references observations(id), version int not null,
  title text not null, body text not null, category text not null, offering text not null, industry text not null,
  region text not null, period text not null, evidence_type text not null, confidence text not null,
  attribution text, theme_id int references themes(id),
  status text not null default 'published' check (status in ('published','under_review','withdrawn','superseded')),
  published_by int not null references users(id), published_at text not null, withdrawn_at text
);
create table if not exists reports (
  id serial primary key, shared_id int not null references shared_versions(id), reporter_id int not null,
  reason text not null, status text not null default 'open', decision text, created_at text not null
);
create table if not exists ideas (
  id serial primary key, title text not null, problem text not null, offering text not null, theme_id int references themes(id),
  proposed_outcome text not null, owner text not null, priority text not null, status text not null,
  public_note text, created_by int not null, created_at text not null, updated_at text not null
);
-- An employee's suggestion is internal until a product owner publishes it (existing ideas were all client-visible).
alter table ideas add column if not exists internal int not null default 0;
create table if not exists notifications (
  id serial primary key, user_id int not null references users(id), text text not null, link text,
  created_at text not null, read_at text
);
create table if not exists audit (
  id serial primary key, at text not null, actor_id int, actor text not null, org_id int,
  action text not null, entity text not null, entity_id text, detail text not null default '{}'
);
-- Tamper evidence (added after first deploy): each row's hash covers the previous row's hash and its own fields.
alter table audit add column if not exists prev_hash text;
alter table audit add column if not exists hash text;
`;

const TABLES = ["organisations", "users", "memberships", "entitlements", "sessions", "login_codes", "invitations", "outbox",
  "content", "requests", "observations", "consents", "themes", "shared_versions", "reports", "ideas", "notifications", "audit"];

/**
 * Defence in depth for hosted Postgres. Supabase exposes tables in the public schema through its REST API to the
 * `anon` and `authenticated` roles, with a key that ships to browsers. Row-level security with no policies denies
 * those roles everything, and their privileges are revoked. The app connects as the table owner, which RLS doesn't
 * restrict, so every access still goes through authorize(). Safe to run on PGlite (no such roles).
 */
const LOCKDOWN = `
${TABLES.map((t) => `alter table ${t} enable row level security;`).join("\n")}
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon;
    revoke all on all sequences in schema public from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from authenticated;
    revoke all on all sequences in schema public from authenticated;
  end if;
end $$;
`;

async function connect(): Promise<Driver> {
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import("postgres");
    // prepare: false works with Supabase's transaction pooler (port 6543) on serverless. Serverless instances are frozen
    // between requests and the pooler drops idle clients, so a pooled connection can be dead when an instance thaws and
    // the next query hangs on it. Idle connections close after 20 s, none lives past 30 min, and connecting gives up
    // after 10 s, so a request reconnects instead of waiting on a dead socket.
    const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 5, idle_timeout: 20, max_lifetime: 60 * 30, connect_timeout: 10 });
    const exec = (s: typeof sql): Exec => async (q, p) => [...(await s.unsafe(q, p as never[]))] as Record<string, unknown>[];
    return {
      exec: exec(sql),
      // Every transaction guards itself (SET LOCAL lasts only until it ends, so pooled connections stay clean): a lock
      // wait gives up after 5 s instead of queueing behind a stuck writer, and a transaction left open by a request the
      // platform killed is ended after 15 s idle, releasing its locks, instead of blocking every later write.
      transaction: (fn) => sql.begin(async (t) => {
        await t.unsafe("set local lock_timeout = '5s'");
        await t.unsafe("set local idle_in_transaction_session_timeout = '15s'");
        return fn(exec(t as unknown as typeof sql));
      }) as never,
      script: async (q) => { await sql.unsafe(q); },
    };
  }
  // Serverless platforms have a read-only, per-instance filesystem: an embedded database there would lose data.
  if (process.env.VERCEL) throw new Error("DATABASE_URL is required on Vercel (use the Supabase transaction pooler URI)");
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = join(process.cwd(), "data", "pg");
  mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  const exec: Exec = async (q, p) => (await pg.query(q, p)).rows as Record<string, unknown>[];
  return {
    exec,
    transaction: (fn) => pg.transaction((t) => fn(async (q, p) => (await t.query(q, p)).rows as Record<string, unknown>[])),
    script: async (q) => { await pg.exec(q); },
  };
}

// One connection per server process; survives dev hot reloads.
const g = globalThis as unknown as { __azpDb?: Promise<Driver> };
function driver(): Promise<Driver> {
  g.__azpDb ??= (async () => {
    const d = await connect();
    await d.script(SCHEMA);
    await d.script(LOCKDOWN);
    const [{ n }] = await d.exec("select count(*)::int as n from organisations", []);
    if (n === 0) await d.transaction((exec) => seed(exec));
    await sealAudit(d);
    await purgeExpired(d);
    return d;
  })();
  return g.__azpDb;
}

/**
 * Chain any audit rows that don't have a hash yet: rows written before the chain existed, and the seed's history.
 * Runs once per start under the same advisory lock as audit(), so concurrent cold starts can't interleave.
 */
/**
 * Retention (SECURITY.md, "Data retention and withdrawal"): sign-in codes and sessions go 24 hours after they expire or
 * are used, demo outbox messages after 30 days. Runs once per server start; none of these rows is audited content.
 */
async function purgeExpired(d: Driver) {
  // The raw driver takes $n placeholders (the query helpers below translate ?).
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  await d.exec("delete from login_codes where expires_at < $1 or used_at < $1", [dayAgo]);
  await d.exec("delete from sessions where expires_at < $1", [dayAgo]);
  await d.exec("delete from outbox where created_at < $1", [monthAgo]);
}

async function sealAudit(d: Driver) {
  await d.transaction(async (e) => {
    await e(`select pg_advisory_xact_lock(${AUDIT_LOCK})`, []);
    const open = (await e("select id, at, actor_id, actor, org_id, action, entity, entity_id, detail from audit where hash is null order by id", [])) as unknown as (AuditFields & { id: number })[];
    if (!open.length) return;
    let prev = ((await e("select hash from audit where hash is not null and id < $1 order by id desc limit 1", [open[0].id])) as unknown as { hash: string }[])[0]?.hash ?? GENESIS;
    for (const r of open) {
      const h = rowHash(prev, r);
      await e("update audit set prev_hash = $1, hash = $2 where id = $3", [prev, h, r.id]);
      prev = h;
    }
  });
}

const inTx = new AsyncLocalStorage<Exec>();

/** `?` placeholders in our SQL become Postgres's $1, $2... */
const pgParams = (sql: string) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

async function exec(sql: string, params: unknown[]) {
  const run = inTx.getStore() ?? (await driver()).exec;
  return run(pgParams(sql), params);
}

export type Param = string | number | boolean | null;
export const all = async <T = Record<string, unknown>>(sql: string, ...p: Param[]) => (await exec(sql, p)) as T[];
export const one = async <T = Record<string, unknown>>(sql: string, ...p: Param[]) => (await exec(sql, p))[0] as T | undefined;
export const run = async (sql: string, ...p: Param[]) => { await exec(sql, p); };
/** Insert and return the new id. */
export const insert = async (sql: string, ...p: Param[]) => Number((await exec(`${sql} returning id`, p))[0].id);

/** Run `fn` in one transaction: the change and its audit row land together or not at all. */
export async function tx<T>(fn: () => Promise<T>): Promise<T> {
  if (inTx.getStore()) return fn();
  return (await driver()).transaction((e) => inTx.run(e, fn));
}

export const now = () => new Date().toISOString();
