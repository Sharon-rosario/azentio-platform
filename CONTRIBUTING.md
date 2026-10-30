# Contributing

How every change in this repository is made. It applies to people and to AI coding assistants alike; `CLAUDE.md`
loads this file automatically for Claude Code.

## Definition of done

A change is done when all of these hold:

- CI is green on the PR and on `main`, with no failing or skipped tests.
- History stays clean: Conventional Commit messages, one concern per branch and per PR, and PRs with real descriptions.
- Every claim in `README.md` and `SECURITY.md` is true in the code and backed by a test
  ([traceability table](docs/requirements-traceability.md)).
- No secrets, keys or `.env` in git; no leftover `console.log` debugging; no TODO-only stubs.
- Lint and typecheck are clean: no `any` escapes, and no `eslint-disable` without a reason in a comment.

## Before you write code

- Read [`README.md`](README.md), [`SECURITY.md`](SECURITY.md), [`docs/architecture.md`](docs/architecture.md) and
  [`docs/requirements-traceability.md`](docs/requirements-traceability.md).
- This is Next.js 16 (see [`AGENTS.md`](AGENTS.md)): check `node_modules/next/dist/docs/` before using a Next API from
  memory.
- Synthetic data only. Never commit `.env`, `data/`, or real names, emails or keys.
- **Develop against the local database.** `npm run dev` uses embedded Postgres in `./data` unless `DATABASE_URL` is set.
  If you keep production values in `.env`, start the dev server with `DATABASE_URL=` (PowerShell:
  `$env:DATABASE_URL=""`) so neither your clicks nor `npm run test:security` write to the shared database.
- Colours, shadows and radii come only from [`src/app/theme.css`](src/app/theme.css); never hard-code a colour in a
  component.

## Branches

- One task, one branch, cut from the latest `main`: `feat/…`, `fix/…`, `docs/…`, `test/…`, `chore/…`, `ci/…`
  (for example `fix/report-restore-guard`).
- Never commit to `main`. Rebase on `main` before opening the PR.

## Commits

- Conventional Commits, lowercase, imperative, under about 72 characters:
  `fix(learning): only restore a copy still under review`.
- The body says **why**, not what. Small, focused commits, one concern each.
- Commit under your own git identity, without `Co-Authored-By` or AI attribution lines.

## Pull requests

- One concern per PR. The title is a plain sentence: "Guard report restore against withdrawn copies".
- The description says what changed, why, and how you verified it (commands run, what you clicked).
- Before opening, all of these pass: `npm run typecheck && npm run lint && npm test`. If you touched `src/server/**`
  or `src/app/api/**`, also run `npm run dev` and `npm run test:security` (every test green).
- Open the PR and let CI go green. Don't merge it yourself; a second team member reviews and merges.

## Security rules (non-negotiable)

- Every API route goes through `route()` ([`src/server/http.ts`](src/server/http.ts)); every service function starts
  with `authorize()` ([`src/server/policy.ts`](src/server/policy.ts)). Deny by default: a new action gets a new
  permission in `GRANTS`, nothing implicit.
- Tenant-owned records go through `sameTenant()`, and a wrong tenant answers **404**, never 403.
- Never trust what the client sends for identity, organisation, role or visibility; use the session's principal.
- Validate every input on the server (`body()`, `id()`, `text()`, `oneOf()`). Malformed input gets a 4xx, never a 500.
- Parameterised SQL only (`?` placeholders); no string-built queries.
- State changes run in `tx()` and write an `audit()` row in the same transaction.
- Shared, cross-client payloads never carry tenant ids, authors, emails or moderator notes.
- AIRA only sees published shared copies; its output is schema-validated and fails closed.
- Every new rule gets a **negative test** in [`tests/security.test.mjs`](tests/security.test.mjs) that proves the wrong
  person is refused.

## Documentation

- A behaviour change updates the matching doc in the same PR: `SECURITY.md` (security), the row and summary counts in
  `docs/requirements-traceability.md`, `docs/architecture.md` (flows), a new `docs/adr/000N-….md` (a real design
  decision), and `README.md` (only if user-facing).
- Plain English, short sentences, facts from the code only: no invented numbers and no marketing words.
