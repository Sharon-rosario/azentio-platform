<div align="center">

<img src="docs/assets/banner.svg" alt="azentio.ai: banks learn from each other, nobody learns who said what" width="100%">

<br>

**An enterprise AI website and a secure collaboration portal, where clients' market observations become governed,
shared learning that improves Azentio's products.**

<p>
  <a href="https://azentio-platform.vercel.app"><b>Live demo</b></a> ·
  <a href="#how-it-works-in-one-story"><b>How it works</b></a> ·
  <a href="#quick-start"><b>Quick start</b></a> ·
  <a href="SECURITY.md"><b>Security model</b></a> ·
  <a href="docs/requirements-traceability.md"><b>Traceability</b></a> ·
  <a href="docs/architecture.md"><b>Architecture</b></a> ·
  <a href="docs/adr/README.md"><b>Decisions</b></a>
</p>

<p>
  <a href="https://nextjs.org"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white"></a>
  <a href="https://react.dev"><img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white"></a>
  <a href="tsconfig.json"><img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white"></a>
  <a href="src/app/theme.css"><img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"></a>
  <a href="docs/adr/0002-postgres-everywhere-with-rls-lockdown.md"><img alt="Postgres" src="https://img.shields.io/badge/Postgres-Supabase_·_PGlite-336791?style=flat-square&logo=postgresql&logoColor=white"></a>
  <a href="src/server/llm.ts"><img alt="AIRA on Claude" src="https://img.shields.io/badge/AIRA-Claude-D97757?style=flat-square&logo=anthropic&logoColor=white"></a>
  <a href="https://azentio-platform.vercel.app"><img alt="Hosted on Vercel" src="https://img.shields.io/badge/hosted_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white"></a>
</p>

<p>
  <a href="tests/security.test.mjs"><img alt="API security tests: 44 passing" src="https://img.shields.io/badge/API_security_tests-44_passing-2ed88e?style=flat-square"></a>
  <a href="tests/unit.test.mjs"><img alt="Unit tests: 9 passing" src="https://img.shields.io/badge/unit_tests-9_passing-2ed88e?style=flat-square"></a>
  <a href=".github/workflows/ci.yml"><img alt="CI on every pull request" src="https://img.shields.io/badge/CI-every_pull_request-16303d?style=flat-square&logo=githubactions&logoColor=white"></a>
  <img alt="Built at Azentio.ai Build Labs 2026" src="https://img.shields.io/badge/built_at-Azentio.ai_Build_Labs_2026-55ffbe?style=flat-square&labelColor=16303d">
</p>

<br>

<img src="docs/screenshots/demo.gif" alt="A 25-second tour: public site, sign-in, a bank's workspace, consent, moderation, shared learning, themes with AIRA, withdrawal" width="860">

<br><br>

<a href="https://azentio-platform.vercel.app/how-it-works"><img src="docs/screenshots/how-it-works-flow.jpg" alt="How it works: one note, from a private thought to a better product, in eight steps" width="860"></a>

</div>

---

Visitors explore Azentio's offerings and request demos. Employees and clients sign in to separate, exclusive
workspaces. Clients contribute market observations; moderators publish de-identified copies; product teams turn the
recurring themes into improvement ideas. Every step is governed by consent, enforced on the server, and audited.

> [!NOTE]
> Built for the **Azentio.ai Build Labs Special Challenge** (Bengaluru, October 2026). It's a prototype, not an
> official Azentio website, and every person, bank and figure in it is synthetic. Try it on the
> [live demo](https://azentio-platform.vercel.app): in demo mode the one-time sign-in code appears on screen.

## How it works, in one story

<img src="docs/assets/lifecycle.svg" alt="The life of an observation: private draft, consent, moderation, shared copy, theme across three or more banks, AIRA summary and improvement idea; withdrawal removes it everywhere in one transaction" width="100%">

Banks notice market problems first, and if they shared what they see, Azentio could build better products for all of
them. But banks compete, so they share only when it's safe: nobody can tell who said what, and they can take it back.
azentio.ai is that safe place, a suggestion box for competing banks with a careful editor in the middle. All the
people and banks below are fictional demo personas.

1. **Sara** at Meridian Bank notices that seasonal shops get flagged as risky in their off-season. She writes it down:
   a private draft only she can see.
2. She proposes it for sharing and allows a reviewed copy to be published, without her bank's name.
3. **Omar**, Azentio's moderator, removes a phone number she left in and publishes a separate, clean copy. Her
   original stays private.
4. **Chen** at Kestrel Finance, another bank, reads the copy and recognises the same problem, with no idea who wrote it.
5. Once three different banks have said something similar, it becomes a theme. Below three, it stays hidden, so no
   single bank can be singled out.
6. **AIRA**, the AI assistant, summarises the theme, quoting the contributions word for word, or it saves nothing.
7. **Priya**, a product owner, turns the theme into an improvement idea, and the banks get a plain status update.
8. Sara can withdraw her note at any time, and it disappears from the feed, search and AI summaries at once.

Banks get better products and early warning without exposing themselves; Azentio gets real market insight; and
everyone can check that the server enforces every rule. Even Azentio's portal administrator can't read a bank's notes.

## Why it's different

| | |
| --- | --- |
| 🔐 **Access decided on the server, every request** | One deny-by-default `authorize()` decides every action from the active membership's roles. Another organisation's record answers `404`, even through a direct API call. The UI only hides what the server would refuse anyway. |
| ✅ **Private by default, consent per purpose** | Saving never shares. Publishing a shared copy, showing the organisation's name and future model training are separate consents with history. Joining a workspace is never consent. |
| 🪪 **The shared copy is a different record** | Moderators publish a reviewed copy with no tenant, author or notes in it, and the region and industry start general. Publication is blocked while any field still holds an email, phone, account number, PAN or IBAN, and one click on **Remove identifiers with AIRA** swaps names and disguised details the patterns can't see for neutral wording, with every change listed for the moderator to check or undo. |
| 🧹 **Withdrawal means gone** | Withdrawing removes the contribution from the feed, search, filters and every AIRA summary of its theme, in one transaction. The retention policy and withdrawal SLA are in [SECURITY.md](SECURITY.md#data-retention-and-withdrawal). |
| 👥 **Small numbers stay hidden** | A theme needs contributions from at least three distinct organisations before any count, evidence or summary is shown, and a filter value is only offered once it covers that many. |
| 🤖 **AI that can only say what the evidence shows** | AIRA summarises approved copies only, answers in a validated schema, and every quote must appear word for word in its source (no fuzzy matching). A summary that can't be backed, or whose evidence changed while AIRA was reading, is thrown away. |

## See it

| | |
|---|---|
| ![Client workspace](docs/screenshots/client-home.jpg) | ![Moderation review](docs/screenshots/moderation.jpg) |
| **Client workspace:** only this organisation's entitled demos, sessions and improvement status | **Moderation:** original beside the reviewed copy; flagged identifiers block publication until removed |
| ![Themes with AIRA](docs/screenshots/themes.jpg) | ![Shared learning](docs/screenshots/shared.jpg) |
| **Themes:** three organisations behind it, de-identified evidence, AIRA summary with verified quotes | **Shared learning:** reviewed copies only, searchable and reportable |

**Try it in two minutes** on the [live demo](https://azentio-platform.vercel.app): sign in as Sara and propose an
observation → as Omar, publish a redacted copy → as Chen, find it in shared learning → as Priya, summarise the
*Seasonality context* theme with AIRA → as Sara, withdraw it and watch it disappear everywhere. The full walkthrough
is in [docs/demo-script.md](docs/demo-script.md).

## Personas

All accounts and data are synthetic. In demo mode the one-time sign-in code appears on screen, because no email
provider is connected. The [How it works](https://azentio-platform.vercel.app/how-it-works) page shows each role and
exactly what the server lets it do:

<p align="center">
  <img src="docs/screenshots/how-it-works-roles.jpg" alt="The two sides: four bank personas and five Azentio roles, with what each can and can't do" width="860">
</p>

<details>
<summary><b>Who can do what</b>: 16 features against the nine personas, as enforced by <code>server/policy.ts</code></summary>
<br>
<img src="docs/screenshots/how-it-works-matrix.jpg" alt="Access matrix: features against personas" width="860">
</details>

| Persona | Email | Can |
|---|---|---|
| Client member, Meridian Bank | `sara@meridianbank.example` | Contribute, read shared learning, follow improvements |
| Client admin, Meridian Bank | `ravi@meridianbank.example` | The above, plus invite and revoke members of Meridian only |
| Client member, Kestrel Finance | `chen@kestrelfinance.example` | Kestrel's workspace only |
| Adviser in two client workspaces | `maya@advisory.example` | Switch between Kestrel and Harbourline, one at a time |
| Learning moderator | `omar@azentio.com` | Review, redact, publish, return, decline; handle reports |
| Product owner | `priya@azentio.com` | Run AIRA on themes; create and progress improvement ideas |
| Content publisher | `lena@azentio.com` | Publish broadcasts and content to chosen audiences |
| Employee | `dev@azentio.com` | Internal experiments, broadcasts, playground |
| Portal administrator | `admin@azentio.com` | Organisations, roles, audit log, demo requests and hackathon registrations (for now); **no** access to client contributions |

## Architecture

One Next.js application. Pages and the API call the same services, and every service starts with the same
`authorize()`; there is no second backend to drift out of step.

```mermaid
flowchart LR
    B[Browser<br/>opaque session cookie only] -->|HTTPS| R
    subgraph APP[Next.js 16 on Vercel]
        direction TB
        R[Server Components<br/>and /api Route Handlers] --> S[Services<br/>learning · insights · members · content]
        S --> P{{authorize · sameTenant<br/>canSeeContent}}
        S --> T[tx: change + audit row<br/>in one transaction]
        S --> L[AIRA<br/>schema-checked, quote-verified]
    end
    T --> DB[(Postgres<br/>Supabase · RLS lockdown)]
    L -->|published copies only| AN[Anthropic API]
```

### Anatomy of a request

<img src="docs/assets/request-anatomy.svg" alt="Anatomy of a request: Chen at Kestrel Finance asks for Meridian Bank's observation 42; the route, session and permission checks pass, the tenant check fails, and the answer is 404 Not found" width="100%">

<sub>Every page and API call goes through the same chain. The security suite's tenant-isolation test (S4) makes exactly this request, with no UI.</sub>

More diagrams (request lifecycle, data model, contribution and shared-copy lifecycles, AIRA pipeline) are in
[docs/architecture.md](docs/architecture.md); the reasoning behind each choice is in the
[decision records](docs/adr/README.md).

## Coverage of the brief

Every requirement is mapped to the code that enforces it and the test that proves it in
[docs/requirements-traceability.md](docs/requirements-traceability.md), including what is partial and what is
still open.

<details open>
<summary><b>Brief sections against what was delivered</b></summary>
<br>

| Brief section | Delivered |
|---|---|
| 03 Personas and access (IAM-01, IAM-02) | Seven roles with separate grants; tenant, audience and entitlement checks on every protected resource; explicit active workspace |
| 04 Login and onboarding | Email one-time codes; single-use, expiring invitations bound to the invited address; no trusted tenant from an arbitrary email |
| 05 Employee portal | Dashboard, internal experiments, employee-only broadcasts, synthetic-data playground, improvement ideas, employee suggestions (internal until a product owner shows them to clients) |
| 06 Client portal | Active organisation, entitled demos and sessions, my and my organisation's observations, shared feed filtered by offering, industry, region, category and observation period, member administration, improvement status |
| 07 Observation capture | Structured form, private drafts, server-side validation, sensitive-content prompts and scanning |
| 08 Review and withdrawal | Audited state machine, separate shared versions, re-review on material edits, reports, withdrawal in one transaction with a stated SLA, in-app notifications |
| 09 Sharing and consent | Three visibility levels, four consent purposes with history, opt-in attribution, safe payloads, minimum-organisation suppression, a written retention policy |
| 10 Insights and improvement | Themes counted by distinct organisation, AIRA synthesis with verified citations, improvement ideas with audited statuses |
| 11 Federated learning (optional P2) | Out of scope; stated, not simulated |

</details>

## Security

<details open>
<summary><b>Controls and where they live</b></summary>
<br>

| Control | Where |
|---|---|
| Deny by default, one policy module | `src/server/policy.ts` |
| Tenant isolation: another tenant's record is `404` | `sameTenant()` |
| Audience and entitlement checks on content | `canSeeContent()` |
| Shared copies carry no tenant, author or notes | `shared_versions`, `sharedFeed()` |
| Hashed one-time codes, `__Host-` HttpOnly session cookie, revocation on the next request | `src/server/auth.ts` |
| Same-origin check on every write; nonce-based CSP (no inline scripts) and strict security headers | `src/server/http.ts`, `src/proxy.ts`, `next.config.ts` |
| Supabase's public API locked: RLS on every table, `anon` grants revoked | `LOCKDOWN` in `src/server/db.ts` |
| Every state change audited in the same transaction, hash-chained for tamper evidence | `src/server/audit.ts`, `audit-chain.ts`, `tx()` |
| Retention policy and withdrawal SLA; expired codes and sessions purged | [SECURITY.md](SECURITY.md#data-retention-and-withdrawal), `purgeExpired()` |
| Locked installs, actions pinned to SHAs, CI fails on high advisories, Dependabot security updates | [SECURITY.md](SECURITY.md#supply-chain), `.github/workflows/ci.yml` |

</details>

44 black-box tests sign in as different personas and attack the API directly (cross-tenant reads and writes, role
escalation, private drafts, payload contents, withdrawal, revocation, CSRF, malformed input on every write route).
CI runs them against a production build on every pull request. The threat model (STRIDE), OWASP Top 10 mapping, what is
simulated and the known limitations are in [SECURITY.md](SECURITY.md).

**Lighthouse (30 Oct 2026):** Accessibility **100** and Best practices **100** on the home page (desktop), How it works
(desktop) and sign-in (mobile). SEO scores low on purpose: every page carries `noindex`, because this prototype uses
Azentio's real brand and must not appear in search results next to azentio.com.

## Quick start

```bash
git clone https://github.com/Sharon-rosario/azentio-platform.git && cd azentio-platform
npm install
npm run dev    # http://localhost:3000: creates and seeds an embedded Postgres in ./data, no set-up needed
```

<details open>
<summary><b>Commands</b></summary>
<br>

| Command | What it does |
|---|---|
| `npm test` | Unit tests: sensitive-content scanner, verbatim quote check, AI finding check, identifier removal, redirect checks, session idle timeout, audit hash chain |
| `npm run test:security` | With the dev server running: the 44 API security tests |
| `npm run attack` | Fifteen common attacks against the live site (or `npm run attack -- http://localhost:3000`), each reported as blocked or not |
| `npm run typecheck && npm run lint` | Type and lint checks, as in CI |
| `npm run reset` | Wipe local data; it's re-seeded on the next request |

</details>

Requires Node.js 20.9 or newer (CI uses 24). AIRA uses the Claude Code CLI if you're signed in to it, or the API if
`ANTHROPIC_API_KEY` is set (see [`.env.example`](.env.example)).

## Deploy (Vercel + Supabase)

1. Create a Supabase project and copy the **transaction pooler** connection string (port 6543).
2. Import the repository into Vercel and set `DATABASE_URL` (the pooler URI), `SESSION_SECRET` (32+ random characters,
   `openssl rand -hex 32`), `ANTHROPIC_API_KEY`, and `DEMO_MODE=1` only for a judging environment.
3. Put Vercel's Function Region next to the database, and deploy. The schema, the RLS lockdown and the synthetic data
   are created on the first request.

Only `main` deploys: [`vercel.json`](vercel.json) turns off preview deployments for every other branch, and CI checks
each pull request on its own.

## Project layout

```
src/
  app/(site)/        public website: products, solutions, insights, connect, hackathon, security
  app/portal/        signed-in portal: workspace, contributions, moderation, themes, ideas, members, admin
  app/api/           Route Handlers, one per resource, all through route()
  server/            services and the security core (server-only): policy, auth, learning, insights, members, db
tests/               API security suite and unit tests
docs/                architecture, demo script, decision records, requirements traceability
```

## Tech stack

| Layer | Choice |
|---|---|
| Application | Next.js 16 (App Router, Server Components, Route Handlers), React 19, TypeScript (strict) |
| UI | Tailwind CSS 4, shadcn/ui on Base UI, lucide icons |
| Design | Azentio's brand (navy, mint, Poppins) from one token file, [`src/app/theme.css`](src/app/theme.css); one contrast-checked light theme |
| Data | Postgres: Supabase in production, PGlite (embedded Postgres) locally |
| AI | Anthropic Claude via the API in production, Claude Code CLI locally; zod-validated structured output |
| Hosting | Vercel |

## Responsible AI and disclosure

AIRA is Anthropic's Claude, used only to summarise approved, de-identified contributions. Its output is labelled,
grounded in verified quotes and never drives an action. This codebase was built with the help of AI coding tools
(Claude Code), as the challenge rules allow.

## Brand and prototype notice

This is a hackathon prototype for the Azentio.ai Build Labs challenge, not an official Azentio website. The Azentio name
and logo belong to Azentio Software and are used at the organiser's request: the challenge asks teams to follow
Azentio's branding and visual identity. Every page says it's a prototype, the deployment asks search engines not to
index it, and all organisations, people and figures in it are synthetic.

## Contributors

<a href="https://github.com/Sharon-rosario/azentio-platform/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Sharon-rosario/azentio-platform" alt="Contributors">
</a>

<div align="center">
<br>
<sub>Built at the Azentio.ai Build Labs hackathon, Bengaluru, October 2026.</sub>
</div>
