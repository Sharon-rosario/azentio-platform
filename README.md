<div align="center">

# azentio.ai: Website & Intelligent Collaboration Portal

**Build intelligence. Create shared value.**

Public discovery · Employee innovation · Client collaboration · Governed collective learning

[Live demo](#live-demo) · [Security](SECURITY.md) · [Architecture](docs/architecture.md) · [Run locally](#run-locally)

</div>

---

azentio.ai is an enterprise AI website and a secure, multi-tenant collaboration portal. Visitors explore Azentio's
offerings and request demos. Employees and clients sign in to exclusive workspaces. Clients contribute market
observations, which moderators turn into de-identified shared learning, which product teams turn into improvements,
and every step is governed by consent, enforced on the server, and audited.

Built for the **Azentio.ai Build Labs Special Challenge**.

## What makes it different

- **Access is enforced on the server, for every request.** One deny-by-default `authorize()` decides every action from
  the active membership's roles. Tenant-owned data from another organisation answers 404, even through direct API
  calls. The interface only hides what the server would refuse anyway.
- **Private by default, consent per purpose.** Saving never shares. Publishing a shared copy, showing the organisation's
  name and future model training are separate, revocable consents. Joining a workspace is never consent.
- **The shared copy is a different object.** Moderators publish a reviewed, de-identified copy that physically cannot
  carry the tenant, the author or internal notes. Publication is blocked while it still contains an email, phone,
  account number, PAN or IBAN.
- **Withdrawal means gone.** Withdrawing removes the contribution from the feed, search and every AI summary that cited
  it, in one transaction.
- **Collective learning that respects small numbers.** Themes need contributions from at least three distinct
  organisations before any count, evidence or summary is shown.
- **AI that can only say what the evidence shows.** AIRA reads approved copies only, answers in a validated schema, and
  every claim cites a quote that is verified against its source. Unbacked summaries are discarded.

## Live demo

> Deployment link: _added after the Vercel deployment_.

Sign in with any persona below (all synthetic). In demo mode the one-time code appears on screen, because no email
provider is connected.

| Persona | Email | Can |
|---|---|---|
| Client member, Meridian Bank | `sara@meridianbank.example` | Contribute, read shared learning, follow improvements |
| Client admin, Meridian Bank | `ravi@meridianbank.example` | Everything above + invite and revoke members of Meridian only |
| Client member, Kestrel Finance | `chen@kestrelfinance.example` | Kestrel's workspace only |
| Adviser in two client workspaces | `maya@advisory.example` | Switch between Kestrel and Harbourline, one at a time |
| Learning moderator | `omar@azentio.com` | Review, redact, publish, return, decline; handle reports |
| Product owner | `priya@azentio.com` | Run AIRA on themes, create and progress improvement ideas |
| Content publisher | `lena@azentio.com` | Publish broadcasts and content to chosen audiences |
| Employee | `dev@azentio.com` | Internal experiments, broadcasts, playground |
| Portal administrator | `admin@azentio.com` | Organisations, roles, audit log (no access to client contributions) |

**Try this path:** sign in as Sara and propose an observation for the community → as Omar, publish a redacted copy →
as Chen, find it in shared learning → as Priya, summarise the *Seasonality context* theme with AIRA → as Sara, withdraw
it and watch it disappear everywhere.

## Coverage of the brief

| Brief section | Delivered |
|---|---|
| 01 Experience | Public site, employee portal, client workspaces, moderation, product-owner loop |
| 03 Personas and access (IAM-01, IAM-02) | Seven roles, separate grants, tenant + audience + entitlement checks on every protected resource, explicit active workspace |
| 04 Login and onboarding | Managed email-code sign-in; single-use, expiring invitations bound to the invited address; no trusted tenant from an arbitrary email |
| 05 Employee portal | Dashboard, internal experiments, employee-only broadcasts, synthetic-data playground, improvement ideas |
| 06 Client portal | Active organisation, entitled demos and sessions, my / my organisation's observations, shared feed with filters, member administration, improvement status |
| 07 Observation capture | Structured form, private drafts, server-side validation, sensitive-content prompts and scanning |
| 08 Review, publication, withdrawal | Explicit state machine with audited transitions, separate shared versions, re-review on material edits, reports, withdrawal well under 60 s, in-app notifications |
| 09 Sharing and consent | Three visibility levels, four consent purposes with history, opt-in attribution, safe payloads |
| 10 Insights and improvement | Theme dashboard with distinct-organisation counts and suppression, AIRA synthesis with verified citations, improvement ideas with audited statuses |
| 11 Federated learning (optional P2) | Out of scope; stated, not simulated |

## Tech stack

| Layer | Choice |
|---|---|
| Application | Next.js 16 (App Router, React Server Components, Route Handlers), React 19, TypeScript (strict) |
| UI | Tailwind CSS 4, shadcn/ui on Base UI, lucide icons |
| Data | Postgres: Supabase in production, PGlite (embedded Postgres) locally |
| AI | Anthropic Claude (Sonnet) via the API in production; Claude Code CLI locally; zod-validated structured output |
| Validation | zod |
| Hosting | Vercel |

## Run locally

Requirements: Node.js 24.

```bash
npm install
npm run dev              # http://localhost:3000, creates and seeds an embedded Postgres in ./data
npm run test:security    # with the dev server running: 15 black-box API security tests
npm run reset            # wipe local data; it is re-seeded on the next request
```

No configuration is needed locally. AIRA uses the Claude Code CLI if you're signed in to it, or the API if
`ANTHROPIC_API_KEY` is set (see [`.env.example`](.env.example)).

## Deploy (Vercel + Supabase)

1. Create a Supabase project and copy the **transaction pooler** connection string (port 6543).
2. Import the repository into Vercel and set:
   - `DATABASE_URL`: the Supabase pooler URI
   - `SESSION_SECRET`: 32+ random characters (`openssl rand -hex 32`)
   - `ANTHROPIC_API_KEY`: for AIRA
   - `DEMO_MODE=1`: only for a judging environment with the synthetic personas
3. Deploy. The schema is created and synthetic data seeded on the first request.

## Project structure

See [docs/architecture.md](docs/architecture.md) for diagrams of the request lifecycle, data model, contribution state
machine and AIRA pipeline.

## Responsible AI and disclosure

AIRA is Anthropic's Claude, used only to summarise approved, de-identified contributions; its output is labelled,
grounded in verified quotes and never drives an action. This codebase was built with the help of AI coding tools
(Claude Code), as the challenge rules allow.

## Security

Read [SECURITY.md](SECURITY.md) for the security model, threat model (STRIDE), OWASP Top 10 mapping, what is simulated
and known limitations.
