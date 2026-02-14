import { SourceTier } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  calculateTrustScore,
  citationGateDecision,
  clampScore,
  confidenceLabelForScore,
  consensusScoreFromJudges,
  freshnessScoreFromCitations,
  tierWeight,
} from "@/lib/services/council-scoring";

describe("council scoring", () => {
  it("calculates weighted trust score", () => {
    const score = calculateTrustScore({
      evidenceScore: 90,
      safetyScore: 80,
      freshnessScore: 70,
      consensusScore: 60,
    });
    expect(score).toBe(78);
  });

  it("maps confidence label thresholds", () => {
    expect(
      confidenceLabelForScore({ groundedOk: true, sourceGatePassed: true, trustScore: 87 }),
    ).toBe("HIGH");
    expect(
      confidenceLabelForScore({ groundedOk: true, sourceGatePassed: true, trustScore: 72 }),
    ).toBe("MEDIUM");
    expect(
      confidenceLabelForScore({ groundedOk: true, sourceGatePassed: true, trustScore: 54 }),
    ).toBe("LOW");
    expect(
      confidenceLabelForScore({ groundedOk: false, sourceGatePassed: true, trustScore: 99 }),
    ).toBe("REVIEW_REQUIRED");
  });

  it("enforces citation gate policy", () => {
    expect(
      citationGateDecision({
        citationCount: 3,
        blockedDomains: [],
        hasTierA: true,
        authoritativeCount: 3,
      }),
    ).toBe(true);

    expect(
      citationGateDecision({
        citationCount: 2,
        blockedDomains: [],
        hasTierA: true,
        authoritativeCount: 2,
      }),
    ).toBe(false);

    expect(
      citationGateDecision({
        citationCount: 5,
        blockedDomains: ["bad.example"],
        hasTierA: true,
        authoritativeCount: 4,
      }),
    ).toBe(false);
  });

  it("scores source tiers predictably", () => {
    expect(tierWeight(SourceTier.A)).toBe(100);
    expect(tierWeight(SourceTier.B)).toBe(80);
    expect(tierWeight(SourceTier.C)).toBe(60);
    expect(tierWeight(undefined)).toBe(40);
  });

  it("computes freshness and consensus helpers", () => {
    const freshnessRecent = freshnessScoreFromCitations([new Date()]);
    expect(freshnessRecent).toBeGreaterThanOrEqual(90);

    const consensusStable = consensusScoreFromJudges([80, 82, 79]);
    const consensusDiverged = consensusScoreFromJudges([30, 95, 60]);
    expect(consensusStable).toBeGreaterThan(consensusDiverged);
  });

  it("clamps scores to 0..100", () => {
    expect(clampScore(120)).toBe(100);
    expect(clampScore(-5)).toBe(0);
  });
});
