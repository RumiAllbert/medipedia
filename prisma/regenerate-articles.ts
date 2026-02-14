import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { enrichArticleMetadata, rebuildRelatedGraph } from "../src/lib/services/article-ai";
import { runCouncilForArticle } from "../src/lib/services/council";
import { generatedArticleSchema, type GeneratedArticlePayload } from "../src/lib/ai/contracts";
import { generateGroundedJson, type GroundingChunk } from "../src/lib/ai/gemini";
import { articlePrompt, DEFAULT_GEMINI_MODEL } from "../src/lib/ai/prompts";
import { ArticleStatus } from "@prisma/client";

/**
 * Regenerates ALL existing articles through the full AI pipeline:
 *   1. Generates new content via Gemini (with Google Search grounding)
 *   2. Updates the article body, summary, and citations
 *   3. Enriches metadata (SEO, tags, entities, key facts)
 *   4. Rebuilds the related-article graph
 *   5. Runs council scoring (Evidence, Safety, Clarity judges)
 *
 * Usage:  npx tsx prisma/regenerate-articles.ts
 *
 * Requires GEMINI_API_KEY and DATABASE_URL in .env
 */

const CONCURRENCY = 2; // parallel article generations (be kind to the API)

async function regenerateArticle(article: { id: string; slug: string; title: string; summary: string }) {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  console.log(`\n  [1/5] Generating content for "${article.title}" with ${model}...`);

  const generated = await generateGroundedJson({
    prompt: articlePrompt(article.title),
    schema: generatedArticleSchema,
    grounded: true,
    maxOutputTokens: 8192,
  });

  if (!generated.data) {
    console.log(`  ⚠ AI generation returned no data for "${article.title}" — skipping`);
    return false;
  }

  const payload: GeneratedArticlePayload = generated.data;

  // Build citations: AI citations + Google Search grounding chunks
  const aiCitations = payload.citations.map((c) => ({
    title: c.title,
    url: c.url,
    sourceType: c.sourceType,
    publishedAt: c.publishedAt ? new Date(c.publishedAt) : null,
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

  console.log(`  [2/5] Updating article (${allCitations.length} citations)...`);

  // Delete old child records and update the article in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.citation.deleteMany({ where: { articleId: article.id } });
    await tx.articleRelatedLink.deleteMany({ where: { sourceArticleId: article.id } });
    if (await tx.articleMetadata.findUnique({ where: { articleId: article.id } })) {
      await tx.articleMetadata.delete({ where: { articleId: article.id } });
    }
    await tx.councilRun.deleteMany({ where: { articleId: article.id } });
    await tx.reviewAlert.deleteMany({ where: { articleId: article.id } });

    await tx.article.update({
      where: { id: article.id },
      data: {
        title: payload.title,
        summary: payload.summary,
        bodyMarkdown: payload.bodyMarkdown,
        status: ArticleStatus.AI_DRAFT,
        isAIGenerated: true,
        trustScore: 0,
        evidenceScore: 0,
        freshnessScore: 0,
        consensusScore: 0,
        confidenceLabel: "REVIEW_REQUIRED",
        scoreVersion: 1,
        lastReviewedAt: null,
        nextReviewAt: null,
      },
    });

    await tx.citation.createMany({
      data: allCitations.map((c) => ({ ...c, articleId: article.id })),
    });

    await tx.articleRevision.create({
      data: {
        articleId: article.id,
        version: (await tx.articleRevision.count({ where: { articleId: article.id } })) + 1,
        contentMarkdown: payload.bodyMarkdown,
        status: ArticleStatus.AI_DRAFT,
        generatedByModel: model,
        createdBy: "ai-regenerator",
        notes: `Regenerated with ${model}`,
      },
    });
  });

  console.log(`  [3/5] Enriching metadata...`);
  await enrichArticleMetadata(article.id);

  console.log(`  [4/5] Rebuilding related graph...`);
  await rebuildRelatedGraph(article.id);

  console.log(`  [5/5] Running council scoring...`);
  const council = await runCouncilForArticle(article.id);
  if (council) {
    console.log(
      `  ✓ Trust: ${council.trustScore} | ${council.confidenceLabel} | Publish: ${council.publishEligible}`,
    );
  } else {
    console.log(`  ⚠ Council scoring failed`);
  }

  return true;
}

async function main() {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set. Cannot regenerate articles.");
    process.exit(1);
  }
  console.log(`\nRegenerating articles with model: ${model}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, title: true, summary: true },
    orderBy: { title: "asc" },
  });

  console.log(`Found ${articles.length} articles to regenerate:`);
  articles.forEach((a, i) => console.log(`  ${i + 1}. ${a.title} (${a.slug})`));

  let succeeded = 0;
  let failed = 0;

  // Process in batches for controlled concurrency
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY);
    console.log(`\n--- Batch ${Math.floor(i / CONCURRENCY) + 1} (${batch.map((a) => a.title).join(", ")}) ---`);

    const results = await Promise.allSettled(batch.map((a) => regenerateArticle(a)));

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        succeeded++;
      } else {
        failed++;
        if (result.status === "rejected") {
          console.error(`  ✗ Error:`, result.reason);
        }
      }
    }
  }

  // Pass 2: wire up related article IDs
  console.log("\n--- Wiring up related-article IDs ---");
  const allArticles = await prisma.article.findMany({ select: { id: true, slug: true } });
  const slugToId = new Map(allArticles.map((a) => [a.slug, a.id]));

  const links = await prisma.articleRelatedLink.findMany({ where: { targetArticleId: null } });
  let wired = 0;
  for (const link of links) {
    const targetId = slugToId.get(link.targetSlug);
    if (targetId) {
      await prisma.articleRelatedLink.update({
        where: { id: link.id },
        data: { targetArticleId: targetId },
      });
      wired++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Regeneration complete!`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Related links wired: ${wired}`);
  console.log(`  Model used: ${model}`);
  console.log(`========================================\n`);
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
