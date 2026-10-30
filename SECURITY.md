# Security

The portal handles client market intelligence across competing organisations, so its central promise is that
**no organisation, role or AI component ever sees more than it is entitled to**, and that this is enforced on the
server for every request, not by what the interface chooses to show.

## Security model

| Principle | How it is enforced | Code |
|---|---|---|
| **Deny by default** | One `authorize(principal, permission)` decides every action. Permissions derive only from the roles on the principal's *active* membership; anything not granted is refused (403). | `src/server/policy.ts` |
| **Tenant isolation** | Every tenant-owned record is checked against the active membership's organisation. A resource from another tenant answers **404**, so identifiers can't be enumerated. | `sameTenant()` in `policy.ts`, `learning.ts` |
| **Explicit audiences** | Content is `public`, `employee` or `client`; client content also requires a product entitlement. Missing audience metadata means deny, never public. | `canSeeContent()` in `policy.ts`, `content.ts` |
| **Least privilege** | Employee status grants no administration. Publishing, moderation, inviting and role changes are separate grants. Portal administrators have **no** implicit read access to client contributions. Client administrators can only assign client roles inside their own organisation. | `GRANTS` in `policy.ts`, `members.ts` |
| **Private by default** | Contributions start as private drafts; saving never shares. Moderators never see unsubmitted drafts. | `learning.ts` |
| **Consent per purpose** | Storing, publishing a shared copy, organisation attribution and future model training are separate, append-only consent records. Membership is never consent. | `consents` table, `submitObservation()` |
| **Data minimisation** | Publishing creates a *separate* shared copy containing only reviewed fields. Tenant ids, authors, original wording and moderator notes cannot leave through the shared feed or its API. | `shared_versions`, `sharedFeed()` |
| **Withdrawal** | Removes the shared copy from the feed, search and every AI summary that cited it in the same database transaction (seconds, not the 60 s required). | `withdrawObservation()`, `invalidateSummaries()` |
| **Aggregation safety** | Theme statistics, evidence and AI summaries are suppressed below a configurable minimum of distinct contributing organisations (default 3). Repeat posts from one organisation count once. | `listThemes()` in `insights.ts` |
| **Database-layer defence in depth** | Row-level security is enabled on every table with no policies, and the `anon` and `authenticated` roles have their table and sequence privileges revoked, so a hosted Postgres's auto-generated REST API (Supabase exposes `public` tables to a key that ships to browsers) returns nothing. The app connects as the table owner, so all access still goes through `authorize()`. | `LOCKDOWN` in `db.ts` |
| **Accountability** | Every state change writes an append-only audit row in the same transaction as the change. | `audit.ts`, `tx()` in `db.ts` |

## Identity and sessions

- **Passwordless sign-in.** Six-digit one-time codes from a CSPRNG, stored only as HMAC-SHA-256 (keyed by
  `SESSION_SECRET`), single use, 10-minute expiry, at most 5 wrong attempts per code and a per-address issuance limit.
  Comparison is constant time. The response never reveals whether an address has an account.
- **No implicit trust from an email.** A newly verified address gets a user with **no** memberships. Organisations are
  joined only through a single-use, expiring invitation bound to the invited, verified address.
- **Sessions.** 256-bit random opaque identifiers; only their SHA-256 hash is stored server-side. The cookie is
  `HttpOnly`, `SameSite=Lax`, `Secure` and `__Host-`-prefixed in production, 8-hour lifetime. Sign-out deletes the
  server-side session. A new session id is issued at every sign-in (no fixation).
- **Redirects.** The post-sign-in destination (`?next=`) and notification links pass `safePath()`: same-origin paths only.
  `//host` and `/\host` are refused because browsers resolve them to another origin, so there is no open redirect.
- **Immediate revocation.** The principal and its memberships are reloaded from the database on every request, so a
  revoked membership or role change applies on the very next request.
- **Workspaces.** A user with several memberships acts in exactly one active organisation at a time and can only switch
  to a membership they hold.

## Platform hardening

- **CSRF:** `SameSite` cookies plus a same-origin (`Origin` vs `Host`) check on every state-changing API request.
- **Headers on every response:** Content-Security-Policy (same-origin sources only, `object-src 'none'`,
  `frame-ancestors 'none'`, `base-uri` and `form-action` restricted), Strict-Transport-Security (2 years, preload),
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  a restrictive `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`; `X-Powered-By` removed.
- **Caching:** API responses are `Cache-Control: no-store`.
- **Injection:** every SQL statement is parameterised; there is no string-built SQL with user input.
- **Input validation:** types, enumerations and lengths are validated on the server for every write, independently of
  the browser. Request bodies must be JSON objects; path ids must be positive integers, and anything else answers
  `404`, the same as a missing record, so ids can't be probed. Malformed input gets a `4xx`, never a `500`, and a
  fuzz test sends wrong shapes and wrong types to every write route as every role to keep it that way.
- **Errors:** one error shape (`{detail}`); unexpected errors return a generic message and are logged server-side only.

## Supply chain

- **Locked installs.** `package-lock.json` is committed and CI installs with `npm ci`, which uses the exact locked
  versions and fails if the lockfile and `package.json` disagree. Next.js and React are pinned to exact versions.
- **Verified packages.** `npm audit signatures`: all 677 installed packages have verified registry signatures, 170
  with provenance attestations (30 Oct 2026).
- **Known advisories.** `npm audit` reports no critical, high or moderate issues. It reports three low ones, all one
  advisory: `deepmerge` prototype poisoning ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)),
  pulled in by the `shadcn` CLI. It isn't reachable in the running app: the only thing the app takes from `shadcn` is a
  stylesheet, at build time. npm's suggested fix downgrades `shadcn` to 1.0.0, a breaking change, so the risk is
  accepted and rechecked with each update.
- **Updates.** Dependabot ([`.github/dependabot.yml`](.github/dependabot.yml)) proposes npm and GitHub Actions updates
  weekly, grouped (Next.js with its ESLint config, React with its types, everything else minor/patch) so each week is
  one or two pull requests that CI verifies. A new release waits seven days before it's proposed, since most
  malicious or broken publishes are pulled within days. Security updates are separate and open as soon as an advisory
  is published.
- **CI permissions.** The workflow token is read-only (`permissions: contents: read`), and CI uses throwaway secrets;
  real ones live only in the deployment environment.
- **Next steps:** pin GitHub Actions to commit SHAs, move `shadcn` to `devDependencies`, and fail CI on
  `npm audit --audit-level=high`.

## AI governance (AIRA)

- **Input boundary:** AIRA only ever receives *published, de-identified shared copies* of a theme that already meets the
  organisation threshold. Private drafts, organisation-only records, tenant identifiers and moderator notes are never
  sent to the model.
- **Prompt-injection resistance:** contributions are passed as delimited data blocks, the model has no tools beyond
  returning a structured answer, and its output can't trigger any action.
- **Structured output:** responses are constrained to a JSON Schema (from zod) and re-validated before use; anything
  that doesn't validate is discarded (fail closed).
- **Grounding:** every claim must cite a quote; each quote is located in its source by word-level matching (exact, then
  a bounded fuzzy match) and quotes under three words are rejected. A summary with no verifiable citation is not saved.
- **Lifecycle:** a summary citing a withdrawn or reported contribution is cleared in the same transaction.
- **Disclosure:** AI output is labelled in the interface with the model and generation time.

## Threat model (STRIDE)

| Threat | Example | Mitigation |
|---|---|---|
| **Spoofing** | Guessing a sign-in code; reusing a stolen code | CSPRNG codes, HMAC at rest, single use, short expiry, attempt and issuance limits; invitation bound to the verified address |
| **Tampering** | Client sends another tenant's id or a forged `orgId` | Tenant derived from the server-side session only; user-supplied tenant ids are ignored or must match; 404 on mismatch |
| **Repudiation** | "I never published that" | Append-only audit rows with actor, organisation, action and detail, written in the same transaction |
| **Information disclosure** | Shared feed leaking the contributing client; small cohorts identifying a client | Separate de-identified copies with safe columns only; opt-in attribution; suppression below 3 organisations; sensitive-content scan blocks publication |
| **Denial of service** | Flooding sign-in codes | Per-address issuance limits and attempt caps (production deployments should add an edge rate limiter) |
| **Elevation of privilege** | Client admin granting `moderator`; employee assuming admin | Client admins limited to client roles in their own organisation; every grant is separate; permissions come only from the active membership |

## OWASP Top 10 (2021) mapping

| Risk | Control |
|---|---|
| A01 Broken access control | Deny-by-default `authorize()`, tenant checks returning 404, audience and entitlement filtering, black-box tests |
| A02 Cryptographic failures | HMAC-SHA-256 code hashing, SHA-256 session-id hashing, HTTPS-only `__Host-` cookies, HSTS |
| A03 Injection | Parameterised SQL only; CSP limits script and resource origins |
| A04 Insecure design | Separate shared representation, consent per purpose, small-cohort suppression, fail-closed AI |
| A05 Security misconfiguration | Security headers on every response; production refuses to start without `SESSION_SECRET` (or, on Vercel, `DATABASE_URL`); demo features off by default in production; row-level security and revoked grants so a hosted database's auto-generated API exposes nothing |
| A07 Identification and authentication failures | Single-use expiring codes, attempt limits, server-side sessions, immediate revocation |
| A08 Software and data integrity failures | Model output schema-validated and never executed; quotes verified against sources |
| A09 Security logging and monitoring failures | Append-only audit trail of privileged and data-changing actions |

## Verification

`tests/security.test.mjs` is a black-box suite of 16 tests that signs in as different personas and calls the API
directly, the way an attacker would: cross-tenant reads and writes, private-draft access within an organisation, role
escalation, moderator and administrator boundaries, feed payload contents, workspace switching, theme suppression, the
full publish-and-withdraw flow, invitation reuse, revocation, cross-site writes, and malformed input on every
write route.

```bash
npm run dev            # in one terminal
npm run test:security  # in another: 16 passing
```

## What is simulated in this build

- **Email delivery.** There is no email provider. Sign-in codes and invitations are written to an outbox; in demo mode
  (on in development, off in production unless `DEMO_MODE=1`) the outbox is shown on screen, and **only** for the seeded
  synthetic personas or addresses in the reserved `.example` domain (RFC 2606), never for a real mailbox.
- **Single sign-on.** The production path for employees is Microsoft Entra ID over OIDC; this build uses the managed
  email-code flow the brief allows when an organisational app registration is unavailable.
- **Federated model learning** (the brief's optional P2 track) is out of scope: AIRA summarises approved evidence and does
  not train or retrain any model.
- All data is synthetic.

## Known limitations and next steps

- `script-src` allows `'unsafe-inline'` for Next.js hydration; a nonce-based CSP via middleware is the next hardening step.
- Rate limits are per address in the database; add IP-based limiting at the edge for production traffic.
- The sensitive-content scanner is pattern-based; pair it with a named-entity model before broad rollout.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the maintainers rather than opening a public issue.
