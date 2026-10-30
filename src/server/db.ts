import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

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
create table if not exists notifications (
  id serial primary key, user_id int not null references users(id), text text not null, link text,
  created_at text not null, read_at text
);
create table if not exists audit (
  id serial primary key, at text not null, actor_id int, actor text not null, org_id int,
  action text not null, entity text not null, entity_id text, detail text not null default '{}'
);
`;

async function connect(): Promise<Driver> {
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import("postgres");
    // prepare: false works with Supabase's transaction pooler (port 6543) on serverless.
    const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
    const exec = (s: typeof sql): Exec => async (q, p) => [...(await s.unsafe(q, p as never[]))] as Record<string, unknown>[];
    return {
      exec: exec(sql),
      transaction: (fn) => sql.begin((t) => fn(exec(t as unknown as typeof sql))) as never,
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
    const [{ n }] = await d.exec("select count(*)::int as n from organisations", []);
    if (n === 0) await d.transaction((exec) => seed(exec));
    return d;
  })();
  return g.__azpDb;
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
