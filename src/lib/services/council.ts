import { addHours } from "date-fns";
import { CouncilRunStatus, SourceTier } from "@prisma/client";

import { councilJudgeSchema } from "@/lib/ai/contracts";
import { generateGroundedJson } from "@/lib/ai/gemini";
import { clarityJudgePrompt, evidenceJudgePrompt, safetyJudgePrompt } from "@/lib/ai/prompts";
import { prisma } from "@/lib/prisma";
import {
  calculateTrustScore,
  citationGateDecision,
  clampScore,
  confidenceLabelForScore,
  consensusScoreFromJudges,
  freshnessScoreFromCitations,
  tierWeight,
} from "@/lib/services/council-scoring";

function toDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

type SourceGateResult = {
  passed: boolean;
  hasTierA: boolean;
  blockedDomains: string[];
  authoritativeCount: number;
  policyScore: number;
  citationDomains: Array<{ domain: string; tier: SourceTier | null; enabled: boolean | null }>;
};

export async function evaluateSourceGate(citationUrls: string[]): Promise<SourceGateResult> {
  const domains = citationUrls.map(toDomain).filter((domain): domain is string => Boolean(domain));
  const uniqueDomains = [...new Set(domains)];
  const policies = await prisma.sourceDomainPolicy.findMany({
    where: { domain: { in: uniqueDomains } },
  });
  const policyMap = new Map(policies.map((policy) => [policy.domain, policy]));

  const rows = uniqueDomains.map((domain) => {
    const policy = policyMap.get(domain);
    return {
      domain,
      tier: policy?.tier ?? null,
      enabled: policy?.enabled ?? null,
    };
  });

  const blockedDomains = rows.filter((row) => row.enabled === false).map((row) => row.domain);
  const authoritativeCount = rows.filter(
    (row) => row.enabled === true && (row.tier === SourceTier.A || row.tier === SourceTier.B),
  ).length;
  const hasTierA = rows.some((row) => row.enabled === true && row.tier === SourceTier.A);
  const policyScore = clampScore(
    rows.reduce((sum, row) => sum + tierWeight(row.tier ?? undefined), 0) / Math.max(1, rows.length),
  );

  return {
    passed: citationGateDecision({
      citationCount: citationUrls.length,
      blockedDomains,
      hasTierA,
      authoritativeCount,
    }),
    hasTierA,
    blockedDomains,
    authoritativeCount,
    policyScore,
    citationDomains: rows,
  };
}

type CouncilOutput = {
  trustScore: number;
  confidenceLabel: string;
  publishEligible: boolean;
  breakdown: Record<string, unknown>;
};

export async function runCouncilForArticle(articleId: string): Promise<CouncilOutput | null> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      citations: true,
      revisions: { orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!article) return null;

  const councilRun = await prisma.councilRun.create({
    data: {
      articleId: article.id,
      articleRevisionId: article.revisions[0]?.id,
      status: CouncilRunStatus.RUNNING,
      scoreVersion: 1,
      aggregateScore: 0,
      breakdownJson: {},
      publishEligible: false,
    },
  });

  const citationInput = article.citations.map((citation) => ({
    title: citation.title,
    url: citation.url,
    sourceType: citation.sourceType,
  }));

  try {
    const startEvidence = Date.now();
    const evidence = await generateGroundedJson({
      prompt: evidenceJudgePrompt({
        title: article.title,
        summary: article.summary,
        bodyMarkdown: article.bodyMarkdown,
        citations: citationInput,
      }),
      schema: councilJudgeSchema,
      grounded: true,
      maxOutputTokens: 1024,
    });
    const startSafety = Date.now();
    const safety = await generateGroundedJson({
      prompt: safetyJudgePrompt({
        title: article.title,
        summary: article.summary,
        bodyMarkdown: article.bodyMarkdown,
      }),
      schema: councilJudgeSchema,
      grounded: true,
      maxOutputTokens: 1024,
    });
    const startClarity = Date.now();
    const clarity = await generateGroundedJson({
      prompt: clarityJudgePrompt({
        title: article.title,
        summary: article.summary,
        bodyMarkdown: article.bodyMarkdown,
      }),
      schema: councilJudgeSchema,
      grounded: true,
      maxOutputTokens: 1024,
    });

    const evidencePayload =
      evidence.data ??
      ({
        score: 40,
        verdict: "WARN",
        rationale: "No grounded evidence judge output; requires manual review.",
        citedUrls: [],
        concerns: ["grounding-missing"],
      } as const);
    const safetyPayload =
      safety.data ??
      ({
        score: 45,
        verdict: "WARN",
        rationale: "No grounded safety output; requires manual review.",
        citedUrls: [],
        concerns: ["grounding-missing"],
      } as const);
    const clarityPayload =
      clarity.data ??
      ({
        score: 55,
        verdict: "WARN",
        rationale: "No grounded clarity output; requires manual review.",
        citedUrls: [],
        concerns: ["grounding-missing"],
      } as const);

    const sourceGate = await evaluateSourceGate(article.citations.map((citation) => citation.url));
    const freshnessScore = freshnessScoreFromCitations(article.citations.map((item) => item.publishedAt));
    const consensusScore = consensusScoreFromJudges([
      evidencePayload.score,
      safetyPayload.score,
      clarityPayload.score,
    ]);
    const evidenceScore = clampScore(evidencePayload.score * 0.7 + sourceGate.policyScore * 0.3);
    const trustScore = calculateTrustScore({
      evidenceScore,
      safetyScore: safetyPayload.score,
      freshnessScore,
      consensusScore,
    });

    const groundedOk = Boolean(
      evidence.groundingMetadata || safety.groundingMetadata || clarity.groundingMetadata,
    );
    const confidenceLabel = confidenceLabelForScore({
      groundedOk,
      sourceGatePassed: sourceGate.passed,
      trustScore,
    });
    const publishEligible = sourceGate.passed && trustScore >= 70 && safetyPayload.verdict !== "FAIL";

    const breakdown = {
      evidenceScore,
      safetyScore: clampScore(safetyPayload.score),
      freshnessScore,
      consensusScore,
      sourceGate,
      judges: {
        evidence: evidencePayload,
        safety: safetyPayload,
        clarity: clarityPayload,
      },
      formula: "0.35*evidence + 0.25*safety + 0.20*freshness + 0.20*consensus",
      generatedAt: new Date().toISOString(),
    };

    await prisma.$transaction(async (tx) => {
      await tx.councilJudgeResult.createMany({
        data: [
          {
            councilRunId: councilRun.id,
            judgeName: "EvidenceQualityJudge",
            score: clampScore(evidencePayload.score),
            verdict: evidencePayload.verdict,
            rationale: evidencePayload.rationale,
            citationsJson: evidencePayload.citedUrls,
            groundingJson: evidence.groundingMetadata ?? {},
            latencyMs: Date.now() - startEvidence,
          },
          {
            councilRunId: councilRun.id,
            judgeName: "MedicalSafetyJudge",
            score: clampScore(safetyPayload.score),
            verdict: safetyPayload.verdict,
            rationale: safetyPayload.rationale,
            citationsJson: safetyPayload.citedUrls,
            groundingJson: safety.groundingMetadata ?? {},
            latencyMs: Date.now() - startSafety,
          },
          {
            councilRunId: councilRun.id,
            judgeName: "ClarityCompletenessJudge",
            score: clampScore(clarityPayload.score),
            verdict: clarityPayload.verdict,
            rationale: clarityPayload.rationale,
            citationsJson: clarityPayload.citedUrls,
            groundingJson: clarity.groundingMetadata ?? {},
            latencyMs: Date.now() - startClarity,
          },
        ],
      });

      await tx.councilRun.update({
        where: { id: councilRun.id },
        data: {
          status: CouncilRunStatus.SUCCEEDED,
          aggregateScore: trustScore,
          breakdownJson: breakdown,
          publishEligible,
        },
      });

      const previousTrustScore = article.trustScore;
      await tx.article.update({
        where: { id: article.id },
        data: {
          trustScore,
          confidenceLabel,
          trustBreakdownJson: breakdown,
          evidenceScore,
          freshnessScore,
          consensusScore,
          scoreVersion: 1,
          nextReviewAt: addHours(new Date(), 24),
          lastReviewedAt: new Date(),
        },
      });

      if (Math.abs(previousTrustScore - trustScore) >= 15 || freshnessScore <= 50) {
        await tx.reviewAlert.create({
          data: {
            articleId: article.id,
            previousTrustScore,
            newTrustScore: trustScore,
            reason:
              freshnessScore <= 50
                ? "Citation freshness degraded."
                : "Trust score drift exceeded threshold.",
          },
        });
      }
    });

    return { trustScore, confidenceLabel, publishEligible, breakdown };
  } catch (error) {
    await prisma.councilRun.update({
      where: { id: councilRun.id },
      data: {
        status: CouncilRunStatus.FAILED,
        failureReason: error instanceof Error ? error.message : "Council run failed",
      },
    });
    return null;
  }
}

export async function latestCouncilRunForArticle(articleId: string) {
  return prisma.councilRun.findFirst({
    where: { articleId, status: CouncilRunStatus.SUCCEEDED },
    orderBy: { createdAt: "desc" },
    include: { judgeResults: true },
  });
}
