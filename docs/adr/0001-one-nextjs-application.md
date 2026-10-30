# 0001 · One Next.js application, no separate backend

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The brief asks for a public website, an employee portal, client workspaces, moderation and an insights loop, with
access "enforced on the server, including direct API and media requests". The riskiest failure for this product is
an access rule that holds in one place and not another: a page that hides a record while the API still returns it,
or a backend that trusts a tenant id the frontend sent.

We are a small team with a single day to build, and the app must deploy to Vercel.

## Decision

Build one Next.js 16 application (App Router). React Server Components render pages; Route Handlers under `/api`
expose the same operations as JSON. **Both call the same service functions** in `src/server/`, and every service
starts with `authorize()` from `policy.ts`. The browser holds an opaque session cookie and nothing else; it never
decides what a user may see.

Pages go through `load()` (`page.ts`) and API routes through `route()` (`http.ts`), so a refusal surfaces as the
sign-in page, a 403 view or a 404 on a page, and as `{detail}` with the same status code on the API.

## Consequences

- One access decision per operation, shared by page and API: there is no second implementation to drift.
- The black-box test suite can attack the API directly and be confident the pages behave the same.
- One deploy, one runtime, one language (TypeScript), one set of types from the database row to the component.
- Server-only modules (`import "server-only"`) fail the build if imported into client code, so secrets and queries
  can't leak into the browser bundle.
- The API is shaped by what the UI needs, not designed as a public product API. Acceptable: there are no third-party
  consumers.
- Long-running work (AIRA synthesis) runs inside a request; it is bounded by a timeout instead of a job queue.

## Alternatives considered

- **Separate API service (FastAPI / Express) plus a Next.js frontend.** Two deployables, two auth integrations, and
  the tenant check has to be repeated or trusted across a network hop. More moving parts for no gain at this scale.
- **Client-side app over Supabase's auto-generated REST API with RLS policies.** Puts the access rules in SQL policies
  that ship with a browser-visible key. Workable, but harder to review, harder to test as black-box API calls, and a
  single policy mistake exposes a table. See [0002](0002-postgres-everywhere-with-rls-lockdown.md).
