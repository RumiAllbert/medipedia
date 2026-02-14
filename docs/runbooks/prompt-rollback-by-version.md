# Runbook: Prompt Rollback by Version

## Goal

Revert AI behavior quickly without schema rollback.

## Steps

1. Identify stable prompt version from prior release.
2. Update `/Users/rumiallbert/Downloads/scrap/medipedia/src/lib/ai/prompts.ts` constants:
   - `PROMPT_TEMPLATE.*.version`
   - `PROMPT_POLICY_VERSION` if needed
3. Deploy application code change.
4. Keep schema unchanged (rollback should be flag/version-first).
5. Re-run council for high-risk pending articles.

## Safety Checks

- Verify new runs show expected version in `PromptRun` and `CouncilRun`.
- Confirm no increase in hard-fail safety arrays.
- Confirm generation success/failure ratio normalizes.
