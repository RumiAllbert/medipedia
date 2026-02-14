import { SourceTier } from "@prisma/client";
import { differenceInDays } from "date-fns";

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function freshnessScoreFromCitations(publishedAtValues: Array<Date | null>): number {
  const dates = publishedAtValues.filter((item): item is Date => item instanceof Date);
  if (dates.length === 0) return 55;
  const days = dates.map((date) => differenceInDays(new Date(), date));
  const avgDays = days.reduce((sum, item) => sum + item, 0) / days.length;
  if (avgDays <= 30) return 95;
  if (avgDays <= 180) return 82;
  if (avgDays <= 365) return 68;
  return 50;
}

export function consensusScoreFromJudges(scores: number[]): number {
  const mean = scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length);
  const variance =
    scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / Math.max(1, scores.length);
  const stddev = Math.sqrt(variance);
  return clampScore(100 - stddev * 2.2);
}

export function tierWeight(tier: SourceTier | undefined): number {
  if (tier === SourceTier.A) return 100;
  if (tier === SourceTier.B) return 80;
  if (tier === SourceTier.C) return 60;
  return 40;
}

export function citationGateDecision(input: {
  citationCount: number;
  blockedDomains: string[];
  hasTierA: boolean;
  authoritativeCount: number;
}): boolean {
  return (
    input.citationCount >= 3 &&
    input.blockedDomains.length === 0 &&
    input.hasTierA &&
    input.authoritativeCount >= 3
  );
}

export function calculateTrustScore(input: {
  evidenceScore: number;
  safetyScore: number;
  freshnessScore: number;
  consensusScore: number;
}): number {
  return clampScore(
    0.35 * input.evidenceScore +
      0.25 * input.safetyScore +
      0.2 * input.freshnessScore +
      0.2 * input.consensusScore,
  );
}

export function confidenceLabelForScore(input: {
  groundedOk: boolean;
  sourceGatePassed: boolean;
  trustScore: number;
}): string {
  if (!input.groundedOk || !input.sourceGatePassed) return "REVIEW_REQUIRED";
  if (input.trustScore >= 85) return "HIGH";
  if (input.trustScore >= 70) return "MEDIUM";
  return "LOW";
}
