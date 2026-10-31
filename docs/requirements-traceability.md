# Requirements traceability

Every requirement in the organisers' brief (*azentio.ai Website & Intelligent Collaboration Portal*), where the code
enforces it, which automated test proves it, and its status. Kept in step with `main`: a pull request that changes
behaviour updates its rows and the summary in the same change (last full review 30 Oct 2026).

**IDs.** The brief numbers only `IAM-01` and `IAM-02`. Every other ID below is ours: one per requirement sentence or
bullet, in the brief's order, prefixed by section. The section number after each heading is the brief's.

**Status**

| Status | Meaning |
|---|---|
| **Proven** | Enforced on the server and exercised by an automated test that would fail if the rule broke |
| **Enforced** | Enforced on the server; no automated test yet (named code location to read) |
| **Partial** | Part of the requirement is met; the gap is stated |
| **Gap** | Known defect or missing control, listed under [Open gaps](#open-gaps) |
| **Out of scope** | Not built, with the reason (brief marks it optional, P1/P2, or outside the minimum scope) |

**Tests.** `S1`-`S43` are the black-box API tests in [`tests/security.test.mjs`](../tests/security.test.mjs), which sign in
as real personas and call the API directly. `U1`-`U6` are the unit tests in [`tests/unit.test.mjs`](../tests/unit.test.mjs).
CI runs all of them against a production build on every push and pull request ([`ci.yml`](../.github/workflows/ci.yml)).

| Test | Name in the file |
|---|---|
| S1 | signed out: only public content, everything else refused |
| S2 | a wrong code is refused, and a code works once |
| S3 | a new verified email gets no organisation: no tenant is trusted by default |
| S4 | tenant isolation: another organisation's observation is not found, even by id |
| S5 | a private draft stays private, even inside the same organisation |
| S6 | roles: clients can't moderate or administer; admins can't read client observations |
| S7 | a moderator never sees unsubmitted drafts |
| S8 | client admins can't escalate or reach another tenant |
| S9 | content follows audience and entitlements |
| S10 | the shared feed carries no tenant, author or moderator data |
| S11 | workspace switch only to memberships you hold, and one tenant at a time |
| S12 | themes below three organisations are suppressed for clients, visible to moderators |
| S13 | governed flow: submit → sensitive copy refused → redacted copy published → withdraw removes it at once |
| S14 | revoking a membership takes effect on the next request |
| S15 | cross-site writes are refused |
| S16 | malformed input is refused with 4xx on every write route, never a 500 |
| S17 | a withdrawn copy can't be republished by restoring an open report on it |
| S18 | publishing a new version retires a reported old one, so only one copy can ever be live |
| S19 | visibility can't be changed around the review: community only via submit, and kept until withdrawal |
| S20 | an employee without a publishing grant can't publish content |
| S21 | the playground is for employees: a client gets the refusal, not the tool |
| S22 | a sign-in code for a real mailbox is never shown, even in demo mode |
| S23 | clients see an idea's status and public note, never its internal fields |
| S24 | AIRA's input is published shared copies only: theme evidence has no tenant or author data |
| S25 | the public request form is rate limited per source |
| S26 | public request fields with the wrong types are refused, never a 500 |
| S27 | a de-identified copy names no exact industry, and a filter can't single out one organisation |
| S28 | moderation and report fields with the wrong types are refused on real records, never a 500 |
| S29 | pages get a nonce-based script policy, fresh per request, and the API allows nothing to run |
| S30 | an identifier in any published field blocks publication, not just in the title and text |
| S31 | consent to publish must be an explicit yes: a string like "false" is refused |
| S32 | parallel wrong guesses can't get past the five-attempt limit on a sign-in code |
| S33 | a null origin, wrong-typed idea and content fields and a malformed portal id answer 4xx, never a 500 |
| S34 | a withdrawn observation is its author's alone: colleagues get a 404 |
| S35 | revoking a member cancels their pending invitations, so they can't rejoin |
| S36 | the shared feed filters by observation period, and a withdrawn copy's period leaves the filter options |
| S37 | an employee can suggest an improvement; it stays internal until a product owner shows it to clients |
| S38 | an ended session is sent to sign-in with the reason; a visitor who never signed in isn't told one |
| S39 | SQL injection payloads in search, filters, ids and sign-in are treated as plain text |
| S40 | stored XSS: markup in a contribution is kept as text and rendered escaped |
| S41 | the session cookie is HttpOnly and SameSite, a forged one is refused, and pages carry the browser security headers |
| S42 | signing in doesn't reveal whether an address has an account |
| S43 | the audit log's hash chain verifies end to end after every write in this suite (runs last) |
| U1 | scan flags identifiers that must not reach the shared feed |
| U2 | scan leaves ordinary market observations alone |
| U3 | verbatim keeps a quote only when its words are in the source, and returns the source's own words |
| U4 | safePath allows same-origin paths only (no open redirect) |
| U5 | sessions end after the idle limit, and activity is recorded at most once a minute |
| U6 | the audit hash chain detects an edited, removed or inserted entry |
| U7 | locate keeps an AI identifier finding only when it is really in the copy, in the copy's own characters |

**Where the rules live.** One policy module decides everything: [`src/server/policy.ts`](../src/server/policy.ts)
(`GRANTS`, `authorize`, `sameTenant`, `canSeeContent`). API routes ([`http.ts`](../src/server/http.ts) `route()`) and
server pages ([`page.ts`](../src/server/page.ts) `load()`) call the same service functions, so a page and a direct API
call get the same decision.

---

## Summary

| Section | Requirements | Proven | Enforced | Partial | Gap | Out of scope |
|---|---|---|---|---|---|---|
| 01 Reference: server-side enforcement | 2 | 1 | | 1 | | |
| 03 Personas, IAM-01, IAM-02, access rule | 14 | 12 | 2 | | | |
| 04 Login and onboarding | 8 | 7 | 1 | | | |
| 05 Employee portal | 5 | 2 | 1 | 2 | | |
| 06 Client portal | 7 | 5 | | 1 | | 1 |
| 07 Observation capture | 5 | 4 | | | | 1 |
| 08 Review, publication, withdrawal | 9 | 7 | 1 | 1 | | |
| 09 Sharing, consent, aggregation | 11 | 7 | 4 | | | |
| 10 Insights and improvement | 7 | 2 | 3 | 1 | | 1 |
| 11 Federated model learning (P2) | 1 | | | | | 1 |
| Platform controls (not numbered in the brief) | 6 | 5 | 1 | | | |
| **Total** | **75** | **52** | **13** | **6** | **0** | **4** |

No gaps remain open. Every gap found while building and reviewing it (G-01 to G-15) is fixed, with a test where one can show it, and listed at the end.

---

## 01 · Reference and status

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| REF-01 | Enforce access on the server, including direct API requests | Every route: `http.ts` `route()` → service → `policy.ts` `authorize()`; pages: `page.ts` `load()` | S1, S4-S9, S14 (all call the API directly, no UI) | **Proven** |
| REF-02 | ...and direct media requests | No media files are served: `public/` holds no media, the `content.media_url` column is unused, content is text served through `content.ts` `getContent()` (unseen = 404) | S9 (content API) | **Partial**: nothing to leak today; a media route must reuse `canSeeContent()` before any file is added |

## 03 · Personas and access boundaries

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| IAM-01a | Server-side RBAC plus tenant membership, resource audience and product entitlement checks | `policy.ts` `authorize()`, `sameTenant()`, `canSeeContent()`; `content.ts` `entitlements()` | S4 (tenant), S6 (role), S9 (audience + entitlement) | **Proven** |
| IAM-01b | Multiple memberships; explicit active workspace | `sessions.membership_id`; `auth.ts` `getPrincipal()` (one active membership), `switchWorkspace()` (only memberships held) | S11 | **Proven** |
| IAM-01c | Never derive authority from navigation, localStorage, email suffix alone or a user-supplied tenant id | Principal is reloaded from the database on every request (`getPrincipal()`); no code grants by email domain; client-supplied `orgId` ignored or 404 (`members.ts` `invite()`, `listMembers()`) | S3 (new email gets nothing), S8 (`orgId: 3` → 404) | **Proven** |
| IAM-02a | Least privilege; employee status doesn't imply admin | `policy.ts` `GRANTS.employee` has no admin, moderation, publishing or membership grant | S6 (plain employee can't create ideas) | **Proven** |
| IAM-02b | Publish videos, moderate, invite and change roles are separate grants | `content.publish`, `moderation.review`, `members.manage`, `admin.roles` are separate entries in `GRANTS` | S6, S8 | **Proven** |
| IAM-02c | Deny unless permission and audience conditions are met | `authorize()` throws unless the permission is in the active membership's set; `canSeeContent()` returns false for unknown audiences | S1, S6, S9 | **Proven** |
| ACC-01 | Access only when audience permits, active membership valid, action authorised; public is explicit, never a fallback | `canSeeContent()`: `public` is an explicit value, anything unrecognised is denied; revoked memberships drop out of `getPrincipal()` | S1, S9, S14 | **Proven** |
| ROLE-PUB | Public visitor: catalogue, solutions, insights, demo enquiries, event registration; no private data or config writes | Pages under `src/app/(site)`, including *about* and *media* (which lists only public-audience sessions and recordings, read signed out); `content.ts` `createRequest()`; writes need a grant (`createContent()` → `content.publish`) | S1 (signed-out reads), S16 (signed-out writes refused) | **Proven** |
| ROLE-CLI | Client member: tenant and entitlement checks on every protected resource; no employee-only experiments | `GRANTS.client_member` (no `content.employee`, no `playground.use`); `sameTenant()` | S4, S9 | **Proven** |
| ROLE-CADM | Client admin can't grant platform roles, change another tenant or self-enable products | `members.ts` `invite()` limits roles to `CLIENT_ASSIGNABLE`, own org only; no API writes entitlements | S8 | **Proven** |
| ROLE-PUBL | Content publisher: no identity administration or implicit access to private learning | `GRANTS.publisher` = `content.publish` only | none | **Enforced** |
| ROLE-ADM | Portal admin: privileged actions audited; client-private content needs explicit moderation authorisation, not a broad role | `GRANTS.portal_admin` has no `observations.*`; every privileged service writes `audit()` in the same transaction | S6 (admin gets 403 on observations and moderation) | **Proven**; the audit trail is hash-chained, so an edited, removed or inserted entry is detected (G-05, S43) |
| ROLE-MOD | Moderator: no access to unsubmitted drafts | `learning.ts` `moderationQueue()`, `reviewItem()` only return `visibility='community'` and `status in ('submitted','published')` | S7 | **Proven** |
| ROLE-EMP | Employee: verified work identity plus approved membership; no automatic access to every client's private data | Employee grants carry no `observations.*`; membership is provisioned, never inferred from `@azentio.com` | S3, S6 | **Enforced**: no test signs in a *new* `@azentio.com` address to prove it gets nothing |

## 04 · Login, onboarding and session lifecycle

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| AUTH-01 | Employees: verified identity plus approved employee membership (Entra ID preferred; managed email code allowed) | `auth.ts` `requestCode()`, `verifyCode()`: HMAC-hashed 6-digit code, 10 min, single use, 5 attempts | S2 | **Proven** (email code; Entra ID documented as the production path in SECURITY.md) |
| AUTH-02 | Clients join by invitation tied to a registered organisation | `members.ts` `invite()`, `acceptInvitation()` | S14 | **Proven** |
| AUTH-03 | Client admin invites only into own org, within policy | `invite()` | S8 | **Proven** |
| AUTH-04 | Arbitrary external email never creates a trusted membership | `verifyCode()` creates a user with no membership | S3 | **Proven** |
| AUTH-05 | Single-use, expiring invitation naming organisation and role | `invite()` (7-day expiry, SHA-256 token hash), `acceptInvitation()` (410 when used/expired/revoked) | S14 (second accept → 410) | **Proven** |
| AUTH-06 | Accept only as the intended verified account | `acceptInvitation()` compares the invitation email with the signed-in email | S14 (wrong account → 403) | **Proven** |
| AUTH-07 | Show workspace terms and sharing explanation; joining is not consent | `src/app/invite/[token]/page.tsx` explanation; accepting writes no consent rows | none | **Enforced** |
| AUTH-08 | Land on the right dashboard with only entitled features, active org shown, switcher for multi-membership users | `src/app/portal/page.tsx` (entitled demos, empty states), top panel workspace switcher; sessions end after 30 minutes idle or 8 hours (`getPrincipal()`) | S11, U5 | **Proven** |

## 05 · Employee experience

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| EMP-01 | Employee dashboard; internal notes and sessions separate from public information | `src/app/portal/page.tsx`; `canSeeContent()` keeps `employee` content out of public and client lists | S9 | **Proven** |
| EMP-02 | Guided playground on synthetic data, clearly labelled, never implying a real credit decision | `src/app/portal/playground/page.tsx` (`playground.use`, employees only); `components/insights/playground.tsx` banner "Sample data · simulated output · not a credit decision" | S21 (a client is refused) | **Enforced**: no structured feedback capture after a run |
| EMP-03 | Internal broadcasts restricted to employees; only publishers configure them | `src/app/portal/live/page.tsx` → `listContent(p, "broadcast")`; `createContent()` needs `content.publish` | S9 (no employee content for clients), S20 (a plain employee's `POST /api/content` is refused) | **Proven** |
| EMP-04 | Product owner reviews approved themes, creates an idea, links evidence, updates status; sees only evidence shared for that purpose | `insights.ts` `createIdea()`, `updateIdeaStatus()` (`ideas.write`); themes read published copies only | S6 (non-owner refused) | **Partial**: ideas link to a theme, not to individually chosen contributions |
| EMP-05 | Experiment submissions, hackathon team spaces, release notes, knowledge library with owners and review dates; employees contribute to innovation within their permissions | Employees suggest improvements: `insights.ts` `suggestIdea()` (`ideas.suggest`, a grant separate from `ideas.write`), stored `internal = 1`; `listIdeas()` and `listThemes()` never return an internal idea to a client, and status updates on one notify no client; only a product owner shows it (`publishIdea()`, `ideas.write`, needs a theme with enough evidence); every step audited | S37 (employee suggests; client refused and never sees it; employee can't change status or publish; product owner shows it without internal fields) | **Partial**: suggestions are built; hackathon team spaces, release notes and a knowledge library are not |

## 06 · Client experience

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| CLI-01 | Client dashboard: active org, entitled offerings, sessions, contribution status, ideas; empty states, never another tenant's data | `src/app/portal/page.tsx` (`EmptyState` for no entitlements, sessions, ideas) | S9 | **Proven** |
| CLI-02 | Entitled sandboxes isolated by tenant; no employee-only tools by URL | Playground page refuses without `playground.use`; demos filtered by entitlement in `canSeeContent()` | S9 | **Partial**: clients get entitled demo *content*, not an interactive sandbox; no saved runs exist to isolate |
| CLI-03 | My observations and our organisation's: drafts, submit, follow status, amend returned, withdraw; private vs shared feed distinct | `learning.ts` `listObservations()` (`mine` / `org`), `updateObservation()`, `submitObservation()`, `withdrawObservation()`; separate `/portal/observations` and `/portal/shared` | S5, S13 | **Proven** |
| CLI-04 | Browse and search approved shared observations and safe themes; filters for offering, industry, region, period, topic; search, counts, suggestions and exports follow the same rules | `sharedFeed()` (published copies only, every filter in SQL), `feedFacets()` (published only; offering, industry, region, category and period; `/api/shared/facets`), `listThemes()` | S10, S12, S13 (search finds the item, then not after withdrawal), S36 (period filter, and withdrawn values leave the options) | **Proven** (no exports exist; category stands in for topic) |
| CLI-05 | Client admins invite/revoke members within their org; membership and invitation states shown; no escalation | `members.ts` `invite()`, `revokeMember()`, `listMembers()` (states Pending/Accepted/Revoked/Expired) | S8, S14 | **Proven** |
| CLI-06 | Improvement ideas with plain-language status, owner and last update; no private tickets or internal prioritisation | `insights.ts` `listIdeas()` strips `problem`, `proposed_outcome`, `priority` for non-employees | S23 | **Proven** |
| CLI-07 | Saved searches, bookmarks, comments, support tickets, client resources | `notifications` only | n/a | **Out of scope** ("Add..." items); in-app notifications built |

## 07 · Observation capture

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| OBS-01 | Structured form for the six contribution types; starts as a private draft; Save never shares | `learning.ts` `CATEGORIES`, `createObservation()` (always `status='draft'`); the form sends `private` even when community is picked | S5, S13 | **Proven** |
| OBS-02 | Validate required fields and lengths on client and server | Server: `learning.ts` `clean()`, `http.ts` `text()`/`oneOf()`/`body()`; client: zod schema in `observation-form.tsx` | S16 | **Proven** |
| OBS-03 | Draft, submit, edit-returned and withdraw actions | `updateObservation()` (returned → draft), `submitObservation()`, `withdrawObservation()` | S13 | **Proven** |
| OBS-04 | Attachments with limits and private storage, or links instead | n/a | n/a | **Out of scope**: brief allows omitting attachments in P0 |
| OBS-05 | Prompt to exclude identities, account numbers, credentials; flag likely sensitive content before publication | Form warning in `observation-form.tsx`; `scan.ts` `scan()` shown to author and moderator; `publish()` refuses while any flag matches | U1, U2, S13 (422 "Redact") | **Proven** (pattern-based, stated as a limitation) |

## 08 · Review, publication and withdrawal

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| WF-01 | Explicit allowed transitions with audit events | Status guards in each service function (`updateObservation`, `submitObservation`, `publish`, `sendBack`, `withdrawObservation`), `audit()` in the same transaction | S13, S17, S18 | **Proven**, including the report edge cases (G-01, G-02 fixed) |
| WF-02 | Private source kept separate from the shared copy; copy holds reviewed fields only | `shared_versions` table; `publish()` writes only reviewed fields | S10 (payload has no `org_id`, `author_id`, `author`, `moderator_note`, `observation_id`, `email`) | **Proven** |
| WF-03 | Moderators redact, request clarification, reject duplicates or unsafe material, publish | `publish()` (moderator-edited title, body, region, period), `sendBack()` (`return` / `reject` with a reason) | S13 (redacted copy published) | **Proven** |
| WF-04 | Notify the author in-app on each state change | `audit.ts` `notify()` from `publish()`, `sendBack()`, `decideReport()`, `updateIdeaStatus()` | none | **Enforced**: no notification when a report temporarily unpublishes the author's item |
| WF-05 | Material edits create a new version and need renewed review; never silently widen an audience | `updateObservation()` sends published → submitted and keeps community visibility (`visibilityFor()`); `publish()` increments `version` and supersedes every earlier live or reported copy | S18, S19 | **Proven** |
| WF-06 | Report action; moderator can unpublish during review, decide, inform the contributor; reporter not exposed | `report()` (copy → `under_review`, summaries invalidated); `decideReport()` restores only a copy still `under_review`; withdrawal and republication close open reports; `moderationQueue()` returns no reporter id | S17, S18 | **Proven** |
| WF-07 | Withdrawal invalidates search, index, cache and future AIRA retrieval within 60 s | `withdrawObservation()`: copy withdrawn and `invalidateSummaries()` in one transaction; AIRA reads published copies only | S13 (feed search drops it on the next request) | **Proven** |
| WF-08 | State the production propagation SLA; explain already-viewed copies can't be recalled | SECURITY.md "Data retention and withdrawal": same transaction, no indexes or caches (`no-store`), production commitment within 60 s, what can't be recalled; `observation-actions.tsx` withdraw dialog says the same | S13 (gone from search after withdrawal) | **Proven** |
| NOT-01 | Persisted notification and outbox records; never label anything "email delivered" | `notifications`, `outbox` tables; outbox shown only in demo mode and only for synthetic addresses (`members.ts` `outbox()`) | S2, S14 (read codes from the outbox) | **Partial**: no idempotency key, since no provider sends anything |

## 09 · Sharing, consent and confidentiality

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| SHR-01 | Three choices: private, organisation, proposed community; organisation-only never shared by default | `VISIBILITIES`; community only through `submitObservation()` + `publish()` | S5, S7 | **Proven** |
| SHR-02 | Separate consent for store, publish, attribute, train; append-only history | `consents` table, one row per purpose per change (`createObservation()`, `submitObservation()`, `withdrawObservation()`); history in `getObservation()` | S13 (submit without publish consent → 422) | **Proven** for publish; attribute and train are **Enforced** |
| SHR-03 | No tenant ids, author profiles, attachments or reviewer notes in shared payloads | `sharedFeed()` column list; `listThemes()` strips `org_id` | S10 | **Proven** |
| SHR-04 | De-identified wording by default; attribution opt-in and reviewed | `publish()`: attribution only when the author consented **and** the moderator ticks it | S10 (only the consenting org is attributed) | **Proven** |
| SHR-05 | Reduce specific geography, dates or details that could identify a contributor | Moderator rewrites `region`, `period` and `industry`; a de-identified copy's industry and region default to general values (`GENERAL_INDUSTRY`, `GENERAL_REGION`); industry, region and offering filters only offer and apply values covering at least `MIN_ORGS` organisations (`broadValues()`) | S27 | **Proven** |
| SHR-06 | No pricing, customer records, secrets | `scan()` + publish block; synthetic seed data only. Advisory AI check for names and disguised identifiers the patterns miss: `aiCheck()` (moderators only, items under review only, findings kept only when found in the copy, audited) | U1, S13; U7, S6-S7 (only moderators, never on a draft) | **Enforced** (pattern-based; the AI check advises, never blocks) |
| SHR-07 | Raw private records stay out of analytics, indexes, logs and AI payloads | `synthesize()` builds its prompt from published shared copies only; the audit `detail` stores ids, not bodies | S24 (AIRA's evidence is exactly the published copies, with no tenant or author fields) | **Proven** for AI payloads; logs store ids only (code). The moderator's identifier check sends the copy under review (title and text only, author's publish consent recorded); its audit row stores counts, not text |
| SHR-08 | Show the contributor who can see each version and how it may be used | "Who can see it" column and observation detail page (consents, shared versions) | none | **Enforced** |
| SHR-09 | Accessible withdrawal; retain consent history, approved version and moderation decisions | `withdrawObservation()` keeps rows, marks them withdrawn; `consents` append-only; SECURITY.md "Data retention and withdrawal" documents what is kept, why and for how long (periods proposed pending Azentio policy); `purgeExpired()` deletes expired codes, sessions and old outbox mail | S13 | **Enforced**: the policy is written; the 7-year and 90-day periods are proposals, not automated |
| SHR-10 | Never claim withdrawal can undo a trained model | No model is trained; the `train` consent is recorded only | n/a | **Enforced** |
| AGG-01 | Configurable minimum distinct organisations (3 for judging); suppress small cohorts and differencing-friendly filters | `insights.ts` `MIN_ORGS` (env), `listThemes()` counts distinct `org_id`, suppresses counts, evidence and summary below it; `synthesize()` refuses below it | S12 | **Proven** for themes; the feed's industry filter is affected by G-04 |

## 10 · Insights and improvement loop

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| INS-01 | Searchable feed and theme dashboard: offerings, evidence, period, distinct org count, limitations, latest update; repeat posts from one org count once | `listThemes()` (`Set` of org ids), `src/app/portal/themes/page.tsx` | S12 (Seasonality context = 3 orgs) | **Proven** |
| INS-02 | Ideas: title, problem, offering, evidence, proposed outcome, owner, priority, status, last update; the six statuses | `insights.ts` `IDEA_STATUSES`, `createIdea()` | none | **Partial**: evidence linked by theme, not per contribution (see EMP-04) |
| INS-03 | Status changes audited | `updateIdeaStatus()` → `audit("idea.status")` | none | **Enforced** |
| INS-04 | Close the loop with contributors without exposing private source or roadmaps | `updateIdeaStatus()` notifies authors of published evidence with the status only; `listIdeas()` strips internal fields | none | **Enforced** |
| INS-05 | AI synthesis cites approved contributions; uncertainty preserved; popularity isn't prevalence | `synthesize()`: zod schema with `limitations`, every quote checked by `evidence.ts` `verbatim()` and saved in the source's own words, unverified quotes dropped, nothing saved if none survive or if the evidence changed during the call; LLM fails closed (`llm.ts`) | U3, S12 (refused below threshold) | **Proven** |
| INS-06 | Product changes never automatic | Ideas are records only; nothing deploys | n/a | **Enforced** |
| INS-07 | Clustering, duplicate detection, digests, assisted prioritisation, quality feedback | n/a | n/a | **Out of scope** ("Add..." items) |

## 11 · Optional federated model-learning track (P2)

| ID | Requirement | Enforced in | Proven by | Status |
|---|---|---|---|---|
| FED-01 | Separate, opt-in federated training with local jobs, aggregation, holdout evaluation, threat model | n/a | n/a | **Out of scope**: optional P2 track; stated in SECURITY.md "What is simulated", never simulated or claimed |

## Platform controls (implied by the brief, not numbered)

| ID | Control | Enforced in | Proven by | Status |
|---|---|---|---|---|
| PLAT-01 | CSRF: same-origin check on every write, SameSite cookie | `http.ts` `route()` origin check; `auth.ts` cookie options | S15 | **Proven** |
| PLAT-02 | Session cookie: `__Host-` prefix, HttpOnly, Secure, hashed id at rest, revocation on next request | `auth.ts` `COOKIE`, `verifyCode()`, `getPrincipal()` | S14 | **Proven** |
| PLAT-03 | No 500s or stack traces from malformed input | `http.ts` `body()`, `id()`, `text()`, `oneOf()`; generic 500 body | S16 | **Proven** |
| PLAT-04 | No open redirect after sign-in or from notification links | `src/lib/safe-path.ts` `safePath()` | U4 | **Proven** |
| PLAT-05 | Security headers (CSP, HSTS, frame-ancestors, nosniff) | `src/proxy.ts` (nonce-based page CSP, no inline scripts); `next.config.ts` `headers()` (HSTS, nosniff, frame and referrer policies; `default-src 'none'` for API and files) | S29 | **Proven** |
| PLAT-06 | Hosted database's public REST API exposes nothing | `db.ts` `LOCKDOWN` (RLS on every table, `anon`/`authenticated` grants revoked) | none (needs a hosted Supabase) | **Enforced** |

---

## Open gaps

None. Every gap found while building this table is fixed and tested; see below.

## Fixed gaps

| # | Gap | Fix | Test |
|---|---|---|---|
| G-01 | Restoring an open report on a copy the author had withdrawn republished it | `decideReport()` restores only a copy still `under_review` (409 otherwise); `withdrawObservation()` closes open reports on its copies | S17 |
| G-02 | A reported old version could be restored next to a newer one | `publish()` supersedes `published` **and** `under_review` copies, closes their reports and clears AIRA summaries that cited them | S18 |
| G-04 | A de-identified copy carried the organisation's exact industry, and with few contributors the industry filter singled one out | `publish()` defaults a de-identified copy's industry to a general value the moderator can change; `broadValues()` offers and applies industry and region filters only for values covering at least `MIN_ORGS` organisations. Field types on moderation and report input are checked before use | S27, S28 |
| G-05 | The audit log was append-only by convention only | Hash chain: each row stores `prev_hash` and `hash` = SHA-256 of the previous hash and its own fields; appends take a transaction advisory lock so the chain never forks; earlier rows are chained once at start (`sealAudit()`); `verifyAudit()` recomputes it and the admin page shows the result. Tamper evidence, not prevention: someone with database write access could rebuild the whole chain, so the head hash shown on the admin page should also be recorded outside the database | U6, S43 |
| G-06 | Sessions lasted 8 hours regardless of activity | `getPrincipal()` ends a session unused for 30 minutes (`SESSION_IDLE_MINUTES`) on the server and deletes it; `last_seen_at` is refreshed at most once a minute. Existing databases gain the column through an idempotent `add column if not exists` | U5 |
| G-07 | Public forms weren't rate limited | `createRequest()`: at most 5 stored requests per source and 3 per address in 15 minutes (429 after). The source is a keyed hash of the client IP Vercel sets (`x-real-ip`, which clients can't spoof there); the raw IP is never stored. Field types are checked before use | S25, S26 |
| G-08 | Rules enforced in code had no negative test | Tests added: plain employee can't publish (S20), client refused the playground (S21), clients never see idea internals (S23), AIRA's evidence is published copies only (S24). A new `@azentio.com` address can't be signed in from the demo outbox (S22: real-mailbox codes are never shown), so "the domain grants nothing" stays proven by S3 and `verifyCode()` | S20-S24 |
| G-03 | `PATCH /api/observations/:id` could change visibility around the review | `visibilityFor()`: create and edit accept only `private` or `organisation`; community is set only by submit and kept until withdrawal | S19 |
| G-09 | The identifier check covered only the title and text: an email in the evidence type, period or region was published, and the offering was free text | `publish()` scans every published free-text field; `offering` must be one of the products | S30 |
| G-10 | AIRA's quote check was fuzzy (85% similar), so a quote with "not" removed passed, and the model's wording was saved | `verbatim()`: a quote's words must appear in the source in order (case and punctuation aside), at least five of them, and the source's own words are saved | U3 |
| G-11 | A summary could be saved citing a copy withdrawn or reported during the model call, and withdrawal cleared only summaries that quoted the copy | `synthesize()` locks the theme and saves only if the evidence it read is still exactly what's published (409 otherwise); `invalidateSummaries()` clears every summary of the copy's theme and locks it too | none: needs a model call mid-test |
| G-12 | Races: parallel wrong codes could each pass the attempt check, one code could start two sessions, and a publish in flight could undo a withdrawal | Attempts are counted in one conditional `update … returning` before comparing; a code is marked used only `where used_at is null`; `publish()` and `withdrawObservation()` take a row lock and re-check the status | S32 (a guard: the local database serialises queries, so the race only shows on Postgres) |
| G-13 | Wrong input types could still reach a 500: an `Origin: null` header, numeric idea and content fields, a non-numeric portal id; and any truthy value counted as consent | The origin is parsed safely (unparsable means cross-site); idea and content fields are type-checked; portal pages parse ids with `id()`; consent must be `true` | S31, S33 |
| G-14 | Revoking a member left their pending invitations valid, so they could rejoin; three audited writes ran outside their change's transaction | `revokeMember()` revokes pending invitations to that organisation; `createContent()`, `createRequest()` and `switchWorkspace()` write their audit row in the same transaction | S35 |
| G-15 | A withdrawn observation stayed readable by direct link inside its organisation; a de-identified copy carried the organisation's exact region; the offering filter wasn't held back for small groups | `getObservation()` answers 404 to anyone but the author once withdrawn; `publish()` defaults a de-identified copy's region to "Not disclosed" (the moderator can name a wide region); `broadValues()` now also governs the offering filter | S34 |

## How to re-check this table

```bash
npm run dev               # terminal 1
npm test                  # unit tests (U1-U7)
npm run test:security     # terminal 2: API tests (S1-S43)
```

When a gap is fixed, update its row's status and the summary counts, and add the new test to the legend above.
