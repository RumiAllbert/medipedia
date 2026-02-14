import { describe, expect, it } from "vitest";

import { calculateReviewRiskScore } from "@/lib/services/review-risk";

describe("review queue scoring", () => {
  it("is deterministic for the same inputs", () => {
    const a = calculateReviewRiskScore({
      trustDropMagnitude: 18,
      freshnessScore: 52,
      openAlertCount: 2,
      pendingAgeHours: 28,
    });
    const b = calculateReviewRiskScore({
      trustDropMagnitude: 18,
      freshnessScore: 52,
      openAlertCount: 2,
      pendingAgeHours: 28,
    });

    expect(a).toEqual(b);
  });

  it("prioritizes trust drop and open alerts", () => {
    const lowRisk = calculateReviewRiskScore({
      trustDropMagnitude: 0,
      freshnessScore: 90,
      openAlertCount: 0,
      pendingAgeHours: 1,
    });
    const highRisk = calculateReviewRiskScore({
      trustDropMagnitude: 24,
      freshnessScore: 45,
      openAlertCount: 2,
      pendingAgeHours: 12,
    });

    expect(highRisk.riskScore).toBeGreaterThan(lowRisk.riskScore);
    expect(highRisk.openAlertsPenalty).toBeGreaterThan(lowRisk.openAlertsPenalty);
  });
});
