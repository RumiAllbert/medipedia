# Runbook: Council Drift Investigation

## Trigger

Use this when trust scores drop unexpectedly, fail reasons spike, or publish eligibility changes after a prompt/model update.

## Investigation Flow

1. Review recent `CouncilRun` entries and compare `promptVersion` + `policyVersion`.
2. Check `PromptRun` records for model, token usage, and latency changes.
3. Inspect `breakdownJson.safetyGate` for:
   - `criticalSafetyOmissions`
   - `unsupportedClaims`
   - `requiredFixes`
4. Compare source gate output (`sourceGate.citationDomains`) for domain/tier drift.
5. Sample affected articles in `/articles/:slug` timeline and claim traceability cards.

## Mitigation

1. If caused by prompt change, rollback prompt version pointer.
2. If caused by source policy edits, revert domain policy changes.
3. Re-run council review for impacted articles.

## Exit Criteria

- Fail reason distribution returns to baseline.
- Publish eligibility rate stabilizes.
- Median trust score delta returns to expected range.
