# 0005 · AI fails closed: schema-checked, quote-verified, never acts

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

AIRA summarises themes in the shared learning for product teams. The brief: AI-assisted synthesis cites approved
contributions; generated themes preserve evidence links and uncertainty; popularity is not prevalence; raw private
records stay out of AI provider payloads; no product model changes automatically.

Language models produce fluent text whether or not the evidence supports it, sometimes return malformed output, and
sometimes don't answer at all. A summary that reads well but invents a quote is worse than no summary, because people
will act on it.

## Decision

AIRA (`insights.ts` `synthesize()`, `llm.ts` `parse()`) follows four rules:

1. **Only approved, de-identified input.** The prompt is built from published shared copies only
   ([0004](0004-separate-shared-copies.md)), and only for themes with at least `MIN_ORGS` distinct organisations.
   Private observations, drafts, tenant ids and author names never reach the model.
2. **Structured output, validated.** The model answers through the API's structured outputs, constrained to a zod
   schema (`summary`, `limitations`, `citations[]`). The result is re-validated with zod. A refusal, a cut-off answer,
   a mismatch or a failed call returns `null` with a plain reason, never a half-parsed object.
3. **Every quote verified, word for word.** Each citation must name a contribution that was in the prompt, and its
   words must appear in that contribution in the same order, ignoring only case and punctuation, with at least five
   words (`evidence.ts` `verbatim()`). There is no fuzzy matching: one changed word ("not" to "now") can reverse a
   meaning. The quote is saved in the contribution's own words. Unverified quotes are dropped and counted; if none
   survive, nothing is saved. If any evidence was withdrawn or reported while the model was answering, the summary is
   refused.
4. **Advisory only.** The summary is stored with its model name and time, shown with a limitations line, and audited.
   It never changes a status, publishes anything or drives an action. Withdrawal or a report of any copy in the theme
   clears the summary.

## Consequences

- A summary on screen is backed by quotes a reviewer can check against the contributions underneath it.
- Model outages, timeouts and malformed answers show as a plain message ("The model service didn't answer; try
  again"), never as a broken page or a made-up result.
- Some valid summaries are thrown away when the model paraphrases instead of quoting; that's the right trade here.
- Quote matching proves the words exist, not that the summary's reasoning is sound; the limitations line and human
  review cover that.
- Locally, without an API key, the same code path uses the Claude Code CLI with the same schema and the same checks.

## Alternatives considered

- **Free-text summary with links to the theme's contributions.** Easier, but nothing ties a claim to its evidence.
- **Retrieval over all observations with access filtering at query time.** One missed filter sends private data to a
  third-party provider. Building the prompt only from the shared table removes that risk instead of managing it.
- **Let AIRA propose and create improvement ideas.** The brief requires human decisions on product changes; AIRA
  informs the product owner, who decides.

## Revisions

- **30 Oct 2026:** the first version forced a single tool call and accepted quotes at 85% similarity. Structured
  outputs replaced the forced tool call when current models rejected it, and quote checking became verbatim after a
  review showed a quote with "not" removed still passed (gap G-10 in `docs/requirements-traceability.md`).
