# Prompt Versioning and Traceability

## Overview

Medipedia stores prompt/template provenance in two places:

- `GenerationJob.promptVersion` and `CouncilRun.promptVersion/policyVersion`
- `PromptRun` rows for generation and council judge invocations

This enables model-run observability by template version, model, token counts, and latency.

## Version Sources

Prompt versions are defined in `/Users/rumiallbert/Downloads/scrap/medipedia/src/lib/ai/prompts.ts`:

- `PROMPT_TEMPLATE.*.version`
- `PROMPT_POLICY_VERSION`

Update these only when prompt behavior changes in a way that should be auditable.

## Rollout Steps

1. Deploy additive schema migration (Phase A).
2. Enable `FF_PROMPT_TRACEABILITY=true` in the target environment.
3. Confirm new `PromptRun` rows are being written during generation and council runs.
4. Run `npm run db:backfill-traceability` to populate freshness cache and fallback legacy claims.
5. Monitor failure and latency by `templateKey/templateVersion`.

## Backfill/Repair Commands

- Dry run: `DRY_RUN=1 npm run db:backfill-traceability`
- Write mode: `npm run db:backfill-traceability`
- Re-enrich content if needed: `npm run db:re-enrich`

## Notes

- Keep new fields nullable until backfill validation is complete.
- Do not remove old prompt versions until rollback risk is acceptable.
