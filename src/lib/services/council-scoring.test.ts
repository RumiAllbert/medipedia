import { describe, expect, it } from "vitest";
import { SourceTier } from "@prisma/client";

import {
  clampScore,
  freshnessScoreFromCitations,
  consensusScoreFromJudges,
  tierWeight,
  citationGateDecision,
  calculateTrustScore,
  confidenceLabelForScore,
} from "@/lib/services/council-scoring";

describe("clampScore", () => {
  it("returns value within range", () => {
    expect(clampScore(50)).toBe(50);
  });

  it("clamps below 0 to 0", () => {
    expect(clampScore(-10)).toBe(0);
  });

  it("clamps above 100 to 100", () => {
    expect(clampScore(120)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(clampScore(75.7)).toBe(76);
  });
});

describe("freshnessScoreFromCitations", () => {
  it("returns 55 when no dates are available", () => {
    expect(freshnessScoreFromCitations([])).toBe(55);
    expect(freshnessScoreFromCitations([null, null])).toBe(55);
  });

  it("returns 95 for very recent citations (<= 30 days)", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    expect(freshnessScoreFromCitations([recent])).toBe(95);
  });

  it("returns 50 for very old citations (> 365 days)", () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 3);
    expect(freshnessScoreFromCitations([old])).toBe(50);
  });
});

describe("consensusScoreFromJudges", () => {
  it("returns high score for unanimous judges", () => {
    expect(consensusScoreFromJudges([80, 80, 80])).toBe(100);
  });

  it("returns lower score for divergent judges", () => {
    const score = consensusScoreFromJudges([90, 40, 60]);
    expect(score).toBeLessThan(80);
  });
});

describe("tierWeight", () => {
  it("returns 100 for tier A", () => {
    expect(tierWeight(SourceTier.A)).toBe(100);
  });

  it("returns 80 for tier B", () => {
    expect(tierWeight(SourceTier.B)).toBe(80);
  });

  it("returns 60 for tier C", () => {
    expect(tierWeight(SourceTier.C)).toBe(60);
  });

  it("returns 40 for undefined tier", () => {
    expect(tierWeight(undefined)).toBe(40);
  });
});

describe("citationGateDecision", () => {
  it("passes when all criteria met", () => {
    expect(
      citationGateDecision({
        citationCount: 5,
        blockedDomains: [],
        hasTierA: true,
        authoritativeCount: 3,
      })
    ).toBe(true);
  });

  it("fails when not enough citations", () => {
    expect(
      citationGateDecision({
        citationCount: 2,
        blockedDomains: [],
        hasTierA: true,
        authoritativeCount: 3,
      })
    ).toBe(false);
  });

  it("fails when blocked domains exist", () => {
    expect(
      citationGateDecision({
        citationCount: 5,
        blockedDomains: ["bad.com"],
        hasTierA: true,
        authoritativeCount: 3,
      })
    ).toBe(false);
  });

  it("fails without tier A source", () => {
    expect(
      citationGateDecision({
        citationCount: 5,
        blockedDomains: [],
        hasTierA: false,
        authoritativeCount: 3,
      })
    ).toBe(false);
  });
});

describe("calculateTrustScore", () => {
  it("calculates weighted average", () => {
    const score = calculateTrustScore({
      evidenceScore: 80,
      safetyScore: 80,
      freshnessScore: 80,
      consensusScore: 80,
    });
    expect(score).toBe(80);
  });

  it("applies correct weights", () => {
    const score = calculateTrustScore({
      evidenceScore: 100,
      safetyScore: 0,
      freshnessScore: 0,
      consensusScore: 0,
    });
    expect(score).toBe(35); // 0.35 * 100
  });
});

describe("confidenceLabelForScore", () => {
  it("returns REVIEW_REQUIRED when not grounded", () => {
    expect(
      confidenceLabelForScore({ groundedOk: false, sourceGatePassed: true, trustScore: 90 })
    ).toBe("REVIEW_REQUIRED");
  });

  it("returns HIGH for score >= 85", () => {
    expect(
      confidenceLabelForScore({ groundedOk: true, sourceGatePassed: true, trustScore: 90 })
    ).toBe("HIGH");
  });

  it("returns MEDIUM for score >= 70", () => {
    expect(
      confidenceLabelForScore({ groundedOk: true, sourceGatePassed: true, trustScore: 75 })
    ).toBe("MEDIUM");
  });

  it("returns LOW for score < 70", () => {
    expect(
      confidenceLabelForScore({ groundedOk: true, sourceGatePassed: true, trustScore: 50 })
    ).toBe("LOW");
  });
});
