-- Phase B: apply after Phase A backfill validation.
-- Uses NOT VALID checks to avoid full-table validation locks during rollout.

ALTER TABLE "GenerationJob"
ADD CONSTRAINT "GenerationJob_promptVersion_when_terminal_chk"
CHECK (
  "status" IN ('QUEUED', 'RUNNING')
  OR "promptVersion" IS NOT NULL
) NOT VALID;

ALTER TABLE "CouncilRun"
ADD CONSTRAINT "CouncilRun_prompt_policy_when_terminal_chk"
CHECK (
  "status" = 'RUNNING'
  OR ("promptVersion" IS NOT NULL AND "policyVersion" IS NOT NULL)
) NOT VALID;

ALTER TABLE "ArticleClaim"
ADD CONSTRAINT "ArticleClaim_claimText_nonempty_chk"
CHECK (char_length(trim("claimText")) > 0) NOT VALID;

ALTER TABLE "ClaimCitation"
ADD CONSTRAINT "ClaimCitation_supportType_known_chk"
CHECK ("supportType" IN ('supports', 'partial', 'contradicted')) NOT VALID;

-- Optional follow-up after monitoring window:
-- ALTER TABLE "GenerationJob" VALIDATE CONSTRAINT "GenerationJob_promptVersion_when_terminal_chk";
-- ALTER TABLE "CouncilRun" VALIDATE CONSTRAINT "CouncilRun_prompt_policy_when_terminal_chk";
-- ALTER TABLE "ArticleClaim" VALIDATE CONSTRAINT "ArticleClaim_claimText_nonempty_chk";
-- ALTER TABLE "ClaimCitation" VALIDATE CONSTRAINT "ClaimCitation_supportType_known_chk";
