import { addHours } from "date-fns";
import { CouncilRunStatus, SourceTier, type Prisma } from "@prisma/client";

import { councilJudgeSchema, type CouncilJudgePayload } from "@/lib/ai/contracts";
import { generateGroundedJson } from "@/lib/ai/gemini";
import {
  clarityJudgePrompt,
  evidenceJudgePrompt,
  PROMPT_POLICY_VERSION,
  PROMPT_TEMPLATE,
  safetyJudgePrompt,
} from "@/lib/ai/prompts";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { determinePublishEligibility } from "@/lib/services/council-publish";
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

type JudgeExecution = {
  templateKey: string;
  templateVersion: number;
  kind: string;
  payload: CouncilJudgePayload;
  groundingMetadata: Record<string, unknown> | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
};

async function executeJudge(input: {
  kind: string;
  templateKey: string;
  templateVersion: number;
  prompt: string;
  fallback: CouncilJudgePayload;
}): Promise<JudgeExecution> {
  const startedAt = Date.now();
  const result = await generateGroundedJson({
    prompt: input.prompt,
    schema: councilJudgeSchema,
    grounded: true,
    maxOutputTokens: 2048,
  });

  return {
    kind: input.kind,
    templateKey: input.templateKey,
    templateVersion: input.templateVersion,
    payload: result.data ?? input.fallback,
    groundingMetadata: (result.groundingMetadata as Record<string, unknown> | null) ?? null,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: Date.now() - startedAt,
  };
}

function aggregateJudgeArrays(payloads: CouncilJudgePayload[], key: keyof CouncilJudgePayload): string[] {
  return Array.from(
    new Set(
      payloads
        .flatMap((payload) => payload[key])
        .filter((item): item is string => typeof item === "string" && item.length > 0),
    ),
  );
}

export async function runCouncilForArticle(articleId: string): Promise<CouncilOutput | null> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      citations: true,
      revisions: { orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!article) return null;

  const promptVersion = [
    `e${PROMPT_TEMPLATE.councilEvidence.version}`,
    `s${PROMPT_TEMPLATE.councilSafety.version}`,
    `c${PROMPT_TEMPLATE.councilClarity.version}`,
  ].join("+");

  const councilRun = await prisma.councilRun.create({
    data: {
      articleId: article.id,
      articleRevisionId: article.revisions[0]?.id,
      status: CouncilRunStatus.RUNNING,
      scoreVersion: 1,
      aggregateScore: 0,
      breakdownJson: {},
      publishEligible: false,
      promptVersion,
      policyVersion: PROMPT_POLICY_VERSION,
    },
  });

  const citationInput = article.citations.map((citation) => ({
    title: citation.title,
    url: citation.url,
    sourceType: citation.sourceType,
  }));

  try {
    const [evidence, safety, clarity] = await Promise.all([
      executeJudge({
        kind: "council_evidence",
        templateKey: PROMPT_TEMPLATE.councilEvidence.key,
        templateVersion: PROMPT_TEMPLATE.councilEvidence.version,
        prompt: evidenceJudgePrompt({
          title: article.title,
          summary: article.summary,
          bodyMarkdown: article.bodyMarkdown,
          citations: citationInput,
        }),
        fallback: {
          score: 40,
          verdict: "WARN",
          rationale: "No grounded evidence judge output; requires manual review.",
          citedUrls: [],
          concerns: ["grounding-missing"],
          criticalSafetyOmissions: [],
          unsupportedClaims: ["Evidence output unavailable"],
          requiredFixes: ["Run manual evidence validation"],
        },
      }),
      executeJudge({
        kind: "council_safety",
        templateKey: PROMPT_TEMPLATE.councilSafety.key,
        templateVersion: PROMPT_TEMPLATE.councilSafety.version,
        prompt: safetyJudgePrompt({
          title: article.title,
          summary: article.summary,
          bodyMarkdown: article.bodyMarkdown,
        }),
        fallback: {
          score: 45,
          verdict: "WARN",
          rationale: "No grounded safety output; requires manual review.",
          citedUrls: [],
          concerns: ["grounding-missing"],
          criticalSafetyOmissions: ["Safety output unavailable"],
          unsupportedClaims: [],
          requiredFixes: ["Run manual safety review"],
        },
      }),
      executeJudge({
        kind: "council_clarity",
        templateKey: PROMPT_TEMPLATE.councilClarity.key,
        templateVersion: PROMPT_TEMPLATE.councilClarity.version,
        prompt: clarityJudgePrompt({
          title: article.title,
          summary: article.summary,
          bodyMarkdown: article.bodyMarkdown,
        }),
        fallback: {
          score: 55,
          verdict: "WARN",
          rationale: "No grounded clarity output; requires manual review.",
          citedUrls: [],
          concerns: ["grounding-missing"],
          criticalSafetyOmissions: [],
          unsupportedClaims: [],
          requiredFixes: ["Run manual editorial clarity review"],
        },
      }),
    ]);

    const evidencePayload = evidence.payload;
    const safetyPayload = safety.payload;
    const clarityPayload = clarity.payload;
    const allPayloads = [evidencePayload, safetyPayload, clarityPayload];

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

    const criticalSafetyOmissions = aggregateJudgeArrays(allPayloads, "criticalSafetyOmissions");
    const unsupportedClaims = aggregateJudgeArrays(allPayloads, "unsupportedClaims");
    const requiredFixes = aggregateJudgeArrays(allPayloads, "requiredFixes");
    const hasHardFail =
      criticalSafetyOmissions.length > 0 || unsupportedClaims.length > 0 || requiredFixes.length > 0;

    const groundedOk = Boolean(
      evidence.groundingMetadata || safety.groundingMetadata || clarity.groundingMetadata,
    );
    const confidenceLabel = confidenceLabelForScore({
      groundedOk,
      sourceGatePassed: sourceGate.passed,
      trustScore,
    });

    const publishEligible = determinePublishEligibility({
      sourceGatePassed: sourceGate.passed,
      trustScore,
      safetyVerdict: safetyPayload.verdict,
      criticalSafetyOmissions,
      unsupportedClaims,
      requiredFixes,
    });

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
      safetyGate: {
        hasHardFail,
        criticalSafetyOmissions,
        unsupportedClaims,
        requiredFixes,
      },
      promptVersion,
      policyVersion: PROMPT_POLICY_VERSION,
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
            groundingJson: (evidence.groundingMetadata ?? {}) as Prisma.InputJsonValue,
            latencyMs: evidence.latencyMs,
          },
          {
            councilRunId: councilRun.id,
            judgeName: "MedicalSafetyJudge",
            score: clampScore(safetyPayload.score),
            verdict: safetyPayload.verdict,
            rationale: safetyPayload.rationale,
            citationsJson: safetyPayload.citedUrls,
            groundingJson: (safety.groundingMetadata ?? {}) as Prisma.InputJsonValue,
            latencyMs: safety.latencyMs,
          },
          {
            councilRunId: councilRun.id,
            judgeName: "ClarityCompletenessJudge",
            score: clampScore(clarityPayload.score),
            verdict: clarityPayload.verdict,
            rationale: clarityPayload.rationale,
            citationsJson: clarityPayload.citedUrls,
            groundingJson: (clarity.groundingMetadata ?? {}) as Prisma.InputJsonValue,
            latencyMs: clarity.latencyMs,
          },
        ],
      });

      if (featureFlags.promptTraceability) {
        await tx.promptRun.createMany({
          data: [
            {
              kind: evidence.kind,
              templateKey: evidence.templateKey,
              templateVersion: evidence.templateVersion,
              model: process.env.GEMINI_MODEL ?? "unknown",
              rawResponseRef: `council-run:${councilRun.id}:evidence`,
              inputTokens: evidence.inputTokens,
              outputTokens: evidence.outputTokens,
              latencyMs: evidence.latencyMs,
              articleId: article.id,
              councilRunId: councilRun.id,
            },
            {
              kind: safety.kind,
              templateKey: safety.templateKey,
              templateVersion: safety.templateVersion,
              model: process.env.GEMINI_MODEL ?? "unknown",
              rawResponseRef: `council-run:${councilRun.id}:safety`,
              inputTokens: safety.inputTokens,
              outputTokens: safety.outputTokens,
              latencyMs: safety.latencyMs,
              articleId: article.id,
              councilRunId: councilRun.id,
            },
            {
              kind: clarity.kind,
              templateKey: clarity.templateKey,
              templateVersion: clarity.templateVersion,
              model: process.env.GEMINI_MODEL ?? "unknown",
              rawResponseRef: `council-run:${councilRun.id}:clarity`,
              inputTokens: clarity.inputTokens,
              outputTokens: clarity.outputTokens,
              latencyMs: clarity.latencyMs,
              articleId: article.id,
              councilRunId: councilRun.id,
            },
          ],
        });
      }

      await tx.councilRun.update({
        where: { id: councilRun.id },
        data: {
          status: CouncilRunStatus.SUCCEEDED,
          aggregateScore: trustScore,
          breakdownJson: breakdown,
          publishEligible,
          promptVersion,
          policyVersion: PROMPT_POLICY_VERSION,
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

      if (Math.abs(previousTrustScore - trustScore) >= 15 || freshnessScore <= 50 || hasHardFail) {
        await tx.reviewAlert.create({
          data: {
            articleId: article.id,
            previousTrustScore,
            newTrustScore: trustScore,
            reason: hasHardFail
              ? "Council hard-fail: critical omissions or unsupported claims detected."
              : freshnessScore <= 50
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
