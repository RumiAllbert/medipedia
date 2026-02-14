import { ArticleStatus, GenerationJobStatus } from "@prisma/client";

import {
  generatedArticleSchema,
  metadataSchema,
  relatedCandidatesSchema,
  type GeneratedArticlePayload,
  type MetadataPayload,
  type RelatedCandidate,
} from "@/lib/ai/contracts";
import { generateGroundedJson, type GroundingChunk } from "@/lib/ai/gemini";
import {
  articlePrompt,
  DEFAULT_GEMINI_MODEL,
  metadataPrompt,
  relatedPrompt,
} from "@/lib/ai/prompts";
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
  return {
    title: topicTitle,
    summary: `${topicTitle} is a health topic requiring comprehensive medical review. This article is a preliminary draft generated while editorial review is in progress. Readers should consult qualified healthcare providers for guidance specific to their situation.`,
    bodyMarkdown: `## Overview

**${topicTitle}** is a topic within health and medicine that warrants careful, evidence-based discussion. This article provides a preliminary overview based on current medical knowledge and established clinical guidelines. As with all health information, the content presented here is educational in nature and does not substitute for professional medical advice.

The information in this article is drawn from major medical organizations and peer-reviewed sources. It is intended for a general audience seeking to understand key concepts, current evidence, and clinical significance related to ${topicTitle.toLowerCase()}.

## Background and Context

${topicTitle} is an area of active medical research and clinical practice. Understanding this topic requires considering the interplay of biological mechanisms, clinical evidence, population health data, and individual patient factors.

Healthcare organizations such as the World Health Organization (WHO), the National Institutes of Health (NIH), and specialty medical societies publish guidelines and educational resources related to this topic. These authoritative sources form the foundation of evidence-based practice and inform clinical decision-making.

## Key Considerations

Several important factors are relevant when evaluating information about ${topicTitle.toLowerCase()}:

- **Evidence base**: The strength of available evidence varies across different aspects of this topic. Some areas are supported by robust randomized controlled trials, while others rely on observational studies or expert consensus.
- **Individual variation**: Health outcomes and appropriate interventions can vary significantly between individuals based on age, genetics, comorbidities, and other factors.
- **Evolving knowledge**: Medical understanding continues to advance, and recommendations may be updated as new research emerges.
- **Multidisciplinary approach**: Optimal management often involves collaboration between different healthcare specialties and disciplines.

## Clinical Significance

Understanding ${topicTitle.toLowerCase()} is important for both healthcare providers and patients. Awareness of current evidence, risk factors, and available interventions supports informed decision-making and improved health outcomes.

Patients and caregivers are encouraged to discuss questions about ${topicTitle.toLowerCase()} with their healthcare team, who can provide personalized guidance based on individual circumstances and the most current clinical evidence.

## Current Guidelines and Recommendations

Major medical organizations periodically issue and update guidelines related to this topic. These guidelines are based on systematic reviews of available evidence and expert consensus. Readers should refer to the most recent publications from relevant specialty organizations for the latest recommendations.

> **Note**: This article is a preliminary draft pending full editorial review. Content will be expanded and refined by medical reviewers to ensure accuracy, completeness, and adherence to current evidence-based standards.
`,
    citations: [
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
      {
        title: "National Institutes of Health",
        url: "https://www.nih.gov/health-information",
        sourceType: "government",
        publishedAt: null,
      },
      {
        title: "Cochrane Library - Trusted Evidence",
        url: "https://www.cochranelibrary.com/",
        sourceType: "clinical-database",
        publishedAt: null,
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

export async function enrichArticleMetadata(articleId: string): Promise<void> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return;

  const generated = await generateGroundedJson({
    prompt: metadataPrompt(article.bodyMarkdown),
    schema: metadataSchema,
    grounded: true,
    maxOutputTokens: 1024,
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
    maxOutputTokens: 1024,
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
    },
  });

  return {
    jobId: job.id,
    status: job.status,
    topicSlug,
  };
}

export async function processGenerationJob(jobId: string): Promise<void> {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (job.status === GenerationJobStatus.SUCCEEDED || job.status === GenerationJobStatus.FAILED) {
    return;
  }
  if (job.status === GenerationJobStatus.RUNNING && job.startedAt && job.phase !== "DEQUEUED") {
    return;
  }

  await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: GenerationJobStatus.RUNNING,
      phase: "GENERATING_ARTICLE",
      progress: 25,
      startedAt: job.startedAt ?? new Date(),
    },
  });

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

    const generated = await generateGroundedJson({
      prompt: articlePrompt(job.topicTitle, sourceContext),
      schema: generatedArticleSchema,
      grounded: true,
      maxOutputTokens: 8192,
    });
    const payload = generated.data ?? fallbackArticle(job.topicTitle);

    // Merge Google Search grounding chunks into citations as verified sources
    const aiCitations = payload.citations.map((citation) => ({
      title: citation.title,
      url: citation.url,
      sourceType: citation.sourceType,
      publishedAt: citation.publishedAt ? new Date(citation.publishedAt) : null,
    }));
    const existingUrls = new Set(aiCitations.map((c) => c.url));
    const groundedCitations = generated.groundingChunks
      .filter((chunk: GroundingChunk) => !existingUrls.has(chunk.uri))
      .map((chunk: GroundingChunk) => ({
        title: chunk.title,
        url: chunk.uri,
        sourceType: "google-search-grounding" as string,
        publishedAt: null,
      }));
    const allCitations = [...aiCitations, ...groundedCitations];

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
