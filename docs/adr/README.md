# Architecture decision records

Short records of the decisions that shape this codebase: the context, what we chose, what it costs, and what we
turned down. One decision per file. A decision that changes gets a new record that supersedes the old one; old records
are kept.

| # | Decision | Status |
|---|---|---|
| [0001](0001-one-nextjs-application.md) | One Next.js application, no separate backend | Accepted |
| [0002](0002-postgres-everywhere-with-rls-lockdown.md) | Postgres everywhere, authorisation in the app, RLS as a lockdown | Accepted |
| [0003](0003-email-one-time-codes.md) | Sign in with one-time email codes | Accepted |
| [0004](0004-separate-shared-copies.md) | Publish a separate reviewed copy, never the private source | Accepted |
| [0005](0005-fail-closed-ai.md) | AI fails closed: schema-checked, quote-verified, never acts | Accepted |

Template: **Context** (the forces at play), **Decision**, **Consequences** (good and bad), **Alternatives considered**.
