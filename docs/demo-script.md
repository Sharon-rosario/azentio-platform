# Demo script (about 4 minutes)

All accounts and data are synthetic. In demo mode the sign-in code appears on the sign-in screen; nothing is emailed.

## 1. Public site (30 s)

- Open `/`. The products and solutions, how a contribution is shared safely (draft, consent, reviewed copy, three organisations, withdrawal), the test names, and AIRA's quote beside its source.
- Open `/security`: "every control here is enforced on the server; the overview maps to SECURITY.md".

## 2. A client contributes (60 s), as `sara@meridianbank.example`

- The workspace shows **Meridian Bank** only: its entitled demos, its invitation-only session, improvement status.
- *Contributions → Share an observation.* Point at the de-identification prompt and the three visibility choices:
  "saving never shares".
- Open the draft → *Submit for community sharing*. Three separate permissions: publish (required), show our name,
  future training. "Membership is not consent."

## 3. A moderator reviews (60 s), as `omar@azentio.com`

- *Moderation* → the Kestrel item about a regulator template. The original contains an email address and an account
  number; both are highlighted, and the reviewed copy says "2 flagged matches are still in the copy".
- Press *Publish* without editing: refused, naming the identifiers. Remove them: the warning clears live. Publish.
- "The shared copy is a separate record: no tenant, no author, no notes can leave through it."

## 4. Shared learning and AIRA (60 s), as `priya@azentio.com`

- *Themes* → **Seasonality context**: three distinct organisations, de-identified evidence.
- *Summarise again*: AIRA writes a summary with a limitations line; every quote is verified against its source.
- Point at **New-to-credit evidence**: only two organisations, so details are suppressed for clients.
- *Create improvement idea* → status "Under review"; contributors are notified without internal detail.

## 5. Withdrawal and access (30 s)

- As the author, withdraw a published contribution: it leaves the feed, search and AI summaries in the same
  transaction.
- Optional: as `maya@advisory.example`, switch between Kestrel and Harbourline. One organisation at a time.
- Optional, to show it's enforced on the server and not just hidden: still signed in as Sara, open
  `/api/observations/<id>` with the id of one of Chen's Kestrel contributions. The answer is `404 Not found`, the same
  as an id that doesn't exist.
- Close on the test suite: `npm run test:security`. Thirty-seven black-box tests that attack the API directly, run on
  every pull request in CI. [Requirements traceability](requirements-traceability.md) maps each requirement in the
  brief to the code and the test that proves it.
