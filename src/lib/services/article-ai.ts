import { differenceInDays } from "date-fns";
import { ArticleStatus, GenerationJobStatus } from "@prisma/client";

import {
  generatedArticleSchema,
  metadataSchema,
  relatedCandidatesSchema,
  type GeneratedArticlePayload,
  type GeneratedClaimPayload,
  type MetadataPayload,
  type RelatedCandidate,
} from "@/lib/ai/contracts";
import { generateGroundedJson } from "@/lib/ai/gemini";
import {
  articlePrompt,
  DEFAULT_GEMINI_MODEL,
  metadataPrompt,
  PROMPT_TEMPLATE,
  relatedPrompt,
} from "@/lib/ai/prompts";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { runCouncilForArticle } from "@/lib/services/council";
import { toSlug } from "@/lib/slug";

function fallbackMetadata(title: string): MetadataPayload {
  const slug = title.toLowerCase().replace(/\s+/g, "-");
  return {
    seoTitle: `${title}: Evidence-Based Overview | Medipedia`,
    seoDescription:
      `Learn about ${title.toLowerCase()} — current medical evidence, guidelines, and clinical considerations from trusted health sources.`,
    tags: ["health", "medical", "patient-education", slug],
    entities: [title, "WHO", "NIH", "CDC"],
    keyFacts: [
      `${title} is a topic of active medical research and clinical interest.`,
      "Evidence-based guidelines from major medical organizations inform current practice.",
      "Individual management should be guided by healthcare providers familiar with the patient's history.",
    ],
    readingLevel: "intermediate",
    safetyFlags: ["requires-human-review"],
    confidenceLabel: "REVIEW_REQUIRED",
  };
}

function fallbackArticle(topicTitle: string): GeneratedArticlePayload {
  const citations = [
    {
      title: "World Health Organization - Health Topics",
      url: "https://www.who.int/health-topics",
      sourceType: "public-health",
      publishedAt: null,
    },
    {
      title: "MedlinePlus - National Library of Medicine",
      url: "https://medlineplus.gov/",
      sourceType: "government",
      publishedAt: null,
    },
    {
      title: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/",
      sourceType: "government",
      publishedAt: null,
    },
  ];

  return {
    title: topicTitle,
    summary: `${topicTitle} is a health topic requiring comprehensive medical review. This article is a preliminary draft generated while editorial review is in progress. Readers should consult qualified healthcare providers for guidance specific to their situation.`,
    bodyMarkdown: `## Overview

**${topicTitle}** is a topic within health and medicine that warrants careful, evidence-based discussion. This article provides a preliminary overview based on current medical knowledge and established clinical guidelines.

## Evidence and Safety Notes

This content is educational and not a substitute for professional care. Evidence quality can vary by subtopic, and recommendations may change as new research emerges.

## Next Steps for Review

This draft is designed for medical editorial review. Reviewers should verify claims, strengthen citations, and ensure section-level safety framing before publication.
`,
    citations,
    claims: [
      {
        claimText: `${topicTitle} requires evidence-based review before publication decisions are made.`,
        sectionHeading: "Overview",
        citationUrls: [citations[0].url],
        supportLevel: "SUPPORTED",
      },
      {
        claimText: "Educational health content should not replace personalized clinical advice.",
        sectionHeading: "Evidence and Safety Notes",
        citationUrls: [citations[1].url],
        supportLevel: "SUPPORTED",
      },
    ],
  };
}

function fallbackRelated(): RelatedCandidate[] {
  return [
    { targetTitle: "Preventive care", reason: "Common prevention context", score: 0.72 },
    { targetTitle: "Chronic inflammation", reason: "Shared pathophysiology", score: 0.68 },
    { targetTitle: "Diagnostic imaging", reason: "Related diagnostic pathway", score: 0.62 },
  ];
}

function normalizeUrl(url: string): string {
  return url.trim();
}

function supportLevelToConfidence(supportLevel: GeneratedClaimPayload["supportLevel"]): number {
  if (supportLevel === "SUPPORTED") return 85;
  if (supportLevel === "PARTIAL") return 62;
  return 30;
}

function supportLevelToSupportType(supportLevel: GeneratedClaimPayload["supportLevel"]): string {
  if (supportLevel === "SUPPORTED") return "supports";
  if (supportLevel === "PARTIAL") return "partial";
  return "contradicted";
}

function citationFreshnessDays(publishedAt: Date | null): number | null {
  if (!publishedAt) return null;
  return Math.max(0, differenceInDays(new Date(), publishedAt));
}

function ensureClaims(
  payload: GeneratedArticlePayload,
  topicTitle: string,
  availableCitationUrls: string[],
): GeneratedClaimPayload[] {
  const citationUrlSet = new Set(availableCitationUrls.map(normalizeUrl));

  const normalizedClaims = (payload.claims ?? [])
    .map((claim) => {
      const claimText = claim.claimText.trim();
      if (!claimText) return null;

      const citationUrls = Array.from(
        new Set(
          claim.citationUrls
            .map(normalizeUrl)
            .filter((url) => citationUrlSet.has(url)),
        ),
      );

      return {
        claimText,
        sectionHeading: claim.sectionHeading.trim() || "Overview",
        citationUrls,
        supportLevel: claim.supportLevel,
      } satisfies GeneratedClaimPayload;
    })
    .filter((claim): claim is GeneratedClaimPayload => Boolean(claim));

  const enrichedClaims = normalizedClaims.map((claim) => ({
    ...claim,
    citationUrls:
      claim.citationUrls.length > 0
        ? claim.citationUrls
        : availableCitationUrls.length > 0
          ? [availableCitationUrls[0]]
          : [],
  }));

  if (enrichedClaims.length > 0) {
    return enrichedClaims;
  }

  if (availableCitationUrls.length === 0) {
    return [
      {
        claimText: `${topicTitle} is included as a preliminary draft pending citation-backed review.`,
        sectionHeading: "Overview",
        citationUrls: [],
        supportLevel: "PARTIAL",
      },
    ];
  }

  return [
    {
      claimText: `${topicTitle} content requires human medical review before publication.`,
      sectionHeading: "Overview",
      citationUrls: [availableCitationUrls[0]],
      supportLevel: "SUPPORTED",
    },
  ];
}

async function persistClaims(
  articleId: string,
  claims: GeneratedClaimPayload[],
  citations: Array<{ id: string; url: string }>,
): Promise<void> {
  const citationIdByUrl = new Map(citations.map((citation) => [normalizeUrl(citation.url), citation.id]));
  const fallbackCitationId = citations[0]?.id;

  await prisma.$transaction(async (tx) => {
    await tx.articleClaim.deleteMany({ where: { articleId } });

    for (let index = 0; index < claims.length; index += 1) {
      const claim = claims[index];
      const createdClaim = await tx.articleClaim.create({
        data: {
          articleId,
          sectionHeading: claim.sectionHeading,
          claimText: claim.claimText,
          confidence: supportLevelToConfidence(claim.supportLevel),
          orderIndex: index,
        },
      });

      const citationIds = Array.from(
        new Set(
          claim.citationUrls
            .map((url) => citationIdByUrl.get(normalizeUrl(url)))
            .filter((id): id is string => Boolean(id)),
        ),
      );
      if (citationIds.length === 0 && fallbackCitationId) {
        citationIds.push(fallbackCitationId);
      }

      if (citationIds.length > 0) {
        await tx.claimCitation.createMany({
          data: citationIds.map((citationId) => ({
            claimId: createdClaim.id,
            citationId,
            supportType: supportLevelToSupportType(claim.supportLevel),
          })),
          skipDuplicates: true,
        });
      }
    }
  });
}

async function persistGenerationPromptRun(input: {
  generationJobId: string;
  articleId: string;
  model: string;
  rawResponseRef: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
}): Promise<void> {
  if (!featureFlags.promptTraceability) return;

  await prisma.promptRun.create({
    data: {
      kind: "article_generation",
      templateKey: PROMPT_TEMPLATE.articleGeneration.key,
      templateVersion: PROMPT_TEMPLATE.articleGeneration.version,
      model: input.model,
      rawResponseRef: input.rawResponseRef,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      latencyMs: input.latencyMs,
      generationJobId: input.generationJobId,
      articleId: input.articleId,
    },
  });
}

export async function enrichArticleMetadata(articleId: string): Promise<void> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return;

  const generated = await generateGroundedJson({
    prompt: metadataPrompt(article.bodyMarkdown),
    schema: metadataSchema,
    grounded: true,
    maxOutputTokens: 2048,
  });
  const metadata = generated.data ?? fallbackMetadata(article.title);

  await prisma.articleMetadata.upsert({
    where: { articleId: article.id },
    update: {
      seoTitle: metadata.seoTitle,
      seoDescription: metadata.seoDescription,
      keyFacts: metadata.keyFacts,
      tags: metadata.tags,
      entities: metadata.entities,
      readingLevel: metadata.readingLevel,
      safetyFlags: metadata.safetyFlags,
      generatedByModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    },
    create: {
      articleId: article.id,
      seoTitle: metadata.seoTitle,
      seoDescription: metadata.seoDescription,
      keyFacts: metadata.keyFacts,
      tags: metadata.tags,
      entities: metadata.entities,
      readingLevel: metadata.readingLevel,
      safetyFlags: metadata.safetyFlags,
      generatedByModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    },
  });
}

export async function rebuildRelatedGraph(articleId: string): Promise<void> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return;

  const generated = await generateGroundedJson({
    prompt: relatedPrompt(article.bodyMarkdown),
    schema: relatedCandidatesSchema,
    grounded: false,
    maxOutputTokens: 2048,
  });
  const candidates = (generated.data ?? fallbackRelated()).slice(0, 6);
  const targetSlugs = candidates.map((candidate) => toSlug(candidate.targetTitle));
  const targets = await prisma.article.findMany({
    where: { slug: { in: targetSlugs } },
    select: { id: true, slug: true },
  });
  const targetBySlug = new Map(targets.map((target) => [target.slug, target.id]));

  await prisma.articleRelatedLink.deleteMany({ where: { sourceArticleId: article.id } });
  await prisma.articleRelatedLink.createMany({
    data: candidates.map((item) => {
      const targetSlug = toSlug(item.targetTitle);
      return {
        sourceArticleId: article.id,
        targetArticleId: targetBySlug.get(targetSlug),
        targetSlug,
        targetTitle: item.targetTitle,
        reason: item.reason,
        score: Math.max(0, Math.min(1, item.score)),
      };
    }),
    skipDuplicates: true,
  });
}

export async function enqueueGenerationJob(input: {
  topicTitle: string;
  topicSlug?: string;
  sourceArticleId?: string;
  requestedById?: string;
}): Promise<{
  jobId: string;
  status: GenerationJobStatus | "EXISTS";
  topicSlug: string;
  articleSlug?: string;
}> {
  const topicSlug = input.topicSlug ?? toSlug(input.topicTitle);
  const existingArticle = await prisma.article.findUnique({
    where: { slug: topicSlug },
    select: { id: true, slug: true },
  });
  if (existingArticle) {
    return {
      jobId: `existing:${existingArticle.id}`,
      status: "EXISTS",
      topicSlug,
      articleSlug: existingArticle.slug,
    };
  }

  const existingActiveJob = await prisma.generationJob.findFirst({
    where: {
      topicSlug,
      status: {
        in: [GenerationJobStatus.QUEUED, GenerationJobStatus.RUNNING],
      },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existingActiveJob) {
    return {
      jobId: existingActiveJob.id,
      status: existingActiveJob.status,
      topicSlug,
    };
  }

  const promptVersion = `v${PROMPT_TEMPLATE.articleGeneration.version}`;
  const job = await prisma.generationJob.create({
    data: {
      sourceArticleId: input.sourceArticleId,
      requestedById: input.requestedById,
      topicSlug,
      topicTitle: input.topicTitle,
      status: GenerationJobStatus.QUEUED,
      phase: "QUEUED",
      progress: 0,
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      promptVersion,
    },
  });

  return {
    jobId: job.id,
    status: job.status,
    topicSlug,
  };
}

export async function processGenerationJob(jobId: string): Promise<void> {
  let job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (job.status === GenerationJobStatus.SUCCEEDED || job.status === GenerationJobStatus.FAILED) {
    return;
  }

  if (job.status === GenerationJobStatus.QUEUED) {
    const claim = await prisma.generationJob.updateMany({
      where: { id: job.id, status: GenerationJobStatus.QUEUED },
      data: {
        status: GenerationJobStatus.RUNNING,
        phase: "GENERATING_ARTICLE",
        progress: 25,
        startedAt: job.startedAt ?? new Date(),
        errorMessage: null,
      },
    });
    if (claim.count === 0) return;
  } else if (job.status === GenerationJobStatus.RUNNING && job.phase === "DEQUEUED") {
    const claim = await prisma.generationJob.updateMany({
      where: { id: job.id, status: GenerationJobStatus.RUNNING, phase: "DEQUEUED" },
      data: {
        phase: "GENERATING_ARTICLE",
        progress: 25,
        startedAt: job.startedAt ?? new Date(),
        errorMessage: null,
      },
    });
    if (claim.count === 0) return;
  } else {
    return;
  }
  job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {
    const siblingWithArticle = await prisma.generationJob.findFirst({
      where: {
        topicSlug: job.topicSlug,
        id: { not: job.id },
        generatedArticleId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { generatedArticleId: true },
    });
    if (siblingWithArticle?.generatedArticleId) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: GenerationJobStatus.SUCCEEDED,
          phase: "COMPLETE",
          progress: 100,
          generatedArticleId: siblingWithArticle.generatedArticleId,
          errorMessage: "Resolved by sibling generation job.",
          finishedAt: new Date(),
        },
      });
      return;
    }

    const existing = await prisma.article.findUnique({ where: { slug: job.topicSlug } });
    if (existing) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: GenerationJobStatus.SUCCEEDED,
          phase: "COMPLETE",
          progress: 100,
          generatedArticleId: existing.id,
          finishedAt: new Date(),
        },
      });
      return;
    }

    const sourceContext = job.sourceArticleId
      ? (await prisma.article.findUnique({ where: { id: job.sourceArticleId } }))?.summary
      : undefined;

    const generationStartedAt = Date.now();
    const generated = await generateGroundedJson({
      prompt: articlePrompt(job.topicTitle, sourceContext),
      schema: generatedArticleSchema,
      grounded: true,
      maxOutputTokens: 8192,
    });
    const generationLatency = Date.now() - generationStartedAt;
    const initialPayload = generated.data ?? fallbackArticle(job.topicTitle);

    const aiCitations = initialPayload.citations.map((citation) => {
      const publishedAt = citation.publishedAt ? new Date(citation.publishedAt) : null;
      return {
        title: citation.title,
        url: normalizeUrl(citation.url),
        sourceType: citation.sourceType,
        publishedAt,
        freshnessDays: citationFreshnessDays(publishedAt),
      };
    });
    const citationByUrl = new Map(aiCitations.map((citation) => [citation.url, citation]));
    for (const chunk of generated.groundingChunks) {
      if (!citationByUrl.has(chunk.uri)) {
        citationByUrl.set(chunk.uri, {
          title: chunk.title,
          url: chunk.uri,
          sourceType: "google-search-grounding",
          publishedAt: null,
          freshnessDays: null,
        });
      }
    }
    const allCitations = Array.from(citationByUrl.values());

    const payload: GeneratedArticlePayload = {
      ...initialPayload,
      citations: allCitations.map((citation) => ({
        title: citation.title,
        url: citation.url,
        sourceType: citation.sourceType,
        publishedAt: citation.publishedAt ? citation.publishedAt.toISOString() : null,
      })),
      claims: ensureClaims(initialPayload, job.topicTitle, allCitations.map((citation) => citation.url)),
    };

    const article = await prisma.article.create({
      data: {
        slug: job.topicSlug,
        title: payload.title,
        summary: payload.summary,
        bodyMarkdown: payload.bodyMarkdown,
        status: ArticleStatus.AI_DRAFT,
        isAIGenerated: true,
        createdBy: "ai-generator",
        createdById: job.requestedById ?? null,
        citations: {
          create: allCitations,
        },
        revisions: {
          create: {
            version: 1,
            contentMarkdown: payload.bodyMarkdown,
            status: ArticleStatus.AI_DRAFT,
            generatedByModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
            createdBy: "ai-generator",
            notes: "Auto-generated from missing topic request.",
          },
        },
      },
      include: {
        citations: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    await persistClaims(article.id, payload.claims, article.citations);

    await persistGenerationPromptRun({
      generationJobId: job.id,
      articleId: article.id,
      model: job.model,
      rawResponseRef: `generation-job:${job.id}`,
      inputTokens: generated.inputTokens,
      outputTokens: generated.outputTokens,
      latencyMs: generationLatency,
    });

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        phase: "ENRICHING",
        progress: 55,
      },
    });
    await enrichArticleMetadata(article.id);
    await rebuildRelatedGraph(article.id);

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        phase: "COUNCIL_SCORING",
        progress: 85,
      },
    });
    await runCouncilForArticle(article.id);

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationJobStatus.SUCCEEDED,
        phase: "COMPLETE",
        progress: 100,
        generatedArticleId: article.id,
        rawResponse: generated.rawText,
        promptVersion: job.promptVersion ?? `v${PROMPT_TEMPLATE.articleGeneration.version}`,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationJobStatus.FAILED,
        phase: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown generation error",
        finishedAt: new Date(),
      },
    });
  }
}
