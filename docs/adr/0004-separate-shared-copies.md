# 0004 · Publish a separate reviewed copy, never the private source

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

A client's observation starts private and may, after the author agrees and a moderator reviews it, be shared with
other clients. The brief: keep the original private source separate from the approved shared representation; a
published copy contains only reviewed fields; tenant ids, author profiles and reviewer notes stay out of shared
payloads; material edits need renewed review and must never silently widen an audience; withdrawal must take the
shared copy out of search and AI retrieval.

The simple design is one `observations` table with a `visibility` column, and a feed query that filters on it. Then
the feed reads the same row that holds the author id, the organisation id, the unredacted wording and the moderator's
notes, and keeping those out of every response depends on every query choosing its columns correctly, forever.

## Decision

Two tables. **`observations`** is the private source and never leaves its organisation. **`shared_versions`** is the
only thing other organisations can read. Publishing (`learning.ts` `publish()`) inserts a new `shared_versions` row
holding only the fields the moderator reviewed (possibly redacted title, body, region and period), a version number,
and an attribution that is set only if the author consented **and** the moderator agreed. It has no tenant id, no
author and no notes.

- The feed, search, filters, theme counts and AIRA read `shared_versions` with `status = 'published'` only.
- Editing a published contribution sends the source back to review; the next publication becomes version *n+1* and
  supersedes the previous copy.
- Withdrawal and reports change the copy's status, and clear any AI summary that cited it, in the same transaction.
- Publishing is refused while the sensitive-content scanner still matches anything in the copy.

## Consequences

- The shared feed physically can't return private fields: they aren't in the table it reads. The API test checks the
  payload anyway.
- What was shared, when, in which wording and by whose decision is a row per version, so history survives withdrawal.
- The moderator edits a copy, not the author's words; the original stays intact for the author.
- Two representations to keep consistent: status changes must update both (for example, withdrawal marks the source
  *and* every live copy). The report and withdrawal edge cases need care; see the open gaps in
  [requirements traceability](../requirements-traceability.md).
- Shared copies still carry coarse context (industry, region, period). With very few contributing organisations, that
  context can identify one, so the moderator must generalise it and the theme dashboard suppresses small cohorts.

## Alternatives considered

- **Visibility flag on the source row.** Simplest, but every query becomes a potential leak, redaction would overwrite
  the author's text, and there's no version history.
- **A database view over the source with safe columns.** Better than a flag, but the view can't hold a moderator's
  redaction or old versions, and withdrawal would destroy the record of what was shared.
