# 0002 · Postgres everywhere, authorisation in the app, RLS as a lockdown

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The portal stores competing organisations' private market observations side by side. We need:

- a real relational database with transactions, so a state change and its audit row land together or not at all;
- zero set-up for local development and for reviewers who clone the repo;
- a hosted database for Vercel, whose functions have no lasting disk;
- confidence that the hosted database can't be read around the app.

Supabase, the obvious free hosted Postgres, publishes every table in the `public` schema through an auto-generated
REST API, and the key for it (`anon`) is meant to be shipped to browsers.

## Decision

**Postgres in every environment, with the same SQL.** Locally, PGlite (Postgres compiled to WebAssembly, running
in-process in `data/pg`, no install). In production, Supabase through its transaction pooler (`DATABASE_URL`,
port 6543, prepared statements off). On Vercel the app refuses to start without `DATABASE_URL`, rather than silently
writing to a disk that disappears.

**Authorisation lives in the application**, in one module (`policy.ts`), not in database policies. The app connects
as the table owner.

**Row-level security is used as a lockdown, not as the access model.** On start-up, `db.ts` enables RLS on every table
with **no policies** and revokes all table and sequence privileges from the `anon` and `authenticated` roles. Those
roles, the ones the public REST API uses, can therefore read and write nothing. The table owner isn't subject to RLS,
so the app is unaffected.

The schema is created idempotently and an empty database seeds itself with synthetic data on first connection.

## Consequences

- `git clone && npm install && npm run dev` works with no database to install or configure.
- Local and production behave the same, because they are the same database engine with the same SQL.
- Every write runs in a transaction with its audit row (`tx()`).
- Even if the Supabase `anon` key leaks (it's designed to be public), the REST API returns nothing.
- Access rules are TypeScript, readable in one file and testable as black-box API calls.
- The app's database role is powerful: a bug in a service that skips `authorize()` isn't caught by the database.
  Mitigated by one policy module, every service starting with `authorize()`, and the API security suite.
- No migration tool: `create table if not exists` won't alter an existing table. Fine for a demo with a reset; a
  migration tool is needed before real data.

## Alternatives considered

- **SQLite locally, Postgres in production.** Two dialects; behaviour differs exactly where it hurts (types,
  concurrency, `like` case sensitivity).
- **Supabase RLS policies as the access model** (per-tenant policies keyed on a JWT claim). Strong in principle, but
  the rules are spread across SQL policies, need Supabase Auth or custom JWTs, and are harder to reason about and test
  in a day. We kept RLS for what it's best at here: a closed door.
- **Docker Postgres locally.** Reviewers would need Docker running; PGlite needs nothing.
