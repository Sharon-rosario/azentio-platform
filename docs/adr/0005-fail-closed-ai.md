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
2. **Structured output, validated.** The model must answer through a single tool whose input schema is a zod schema
   (`summary`, `limitations`, `citations[]`). The result is re-validated with zod. Anything that doesn't match
   returns `null` with a plain reason, never a half-parsed object.
3. **Every quote verified.** Each citation must name a contribution that was in the prompt, and its quote must be
   found in that contribution's text (`evidence.ts` `locate()`: exact words, or a close match above 0.85 similarity,
   at least 3 words). Unverified quotes are dropped and counted. If none survive, nothing is saved.
4. **Advisory only.** The summary is stored with its model name and time, shown with a limitations line, and audited.
   It never changes a status, publishes anything or drives an action. Withdrawal or a report of any cited copy clears
   the summary.

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
