# Runbook: Dead-Letter Recovery

## Trigger

Use this when `AgentJob` entries accumulate in `DEAD_LETTER` or generation failures are increasing.

## Immediate Actions

1. Open `/admin/jobs` and inspect current failure errors.
2. Call `POST /api/admin/jobs/requeue-dead-letter` (Admin only).
3. Trigger worker execution (`POST /api/internal/agent/tick` with `x-agent-secret`).

## Validation

- Dead-letter count trends down.
- Retry success rate improves.
- No repeating deterministic error loop.

## If Failures Repeat

1. Isolate root cause in logs (`lastError`, `errorMessage`).
2. Apply targeted fix.
3. Retry single jobs via `POST /api/admin/jobs/:id/retry`.
4. Requeue remaining dead letters after fix confirmation.
