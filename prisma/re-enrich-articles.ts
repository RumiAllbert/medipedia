import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { enrichArticleMetadata, rebuildRelatedGraph } from "../src/lib/services/article-ai";
import { runCouncilForArticle } from "../src/lib/services/council";
import { generatedArticleSchema, type GeneratedArticlePayload } from "../src/lib/ai/contracts";
import { generateGroundedJson, type GroundingChunk } from "../src/lib/ai/gemini";
import { articlePrompt, DEFAULT_GEMINI_MODEL } from "../src/lib/ai/prompts";
import { ArticleStatus } from "@prisma/client";

/**
 * Re-enriches existing articles:
 *   - Articles that already have AI content: re-runs metadata, related graph, and council scoring
 *   - Articles that still have short/seed content: fully regenerates them first
 *
 * Usage:  npx tsx prisma/re-enrich-articles.ts
 */

const CONCURRENCY = 2;
const MIN_AI_BODY_LENGTH = 1500; // AI articles are 1500-3000 words; seed articles are ~500 chars

async function regenerateContent(article: { id: string; slug: string; title: string }) {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  console.log(`    Regenerating content with ${model}...`);

  const generated = await generateGroundedJson({
    prompt: articlePrompt(article.title),
    schema: generatedArticleSchema,
    grounded: true,
    maxOutputTokens: 8192,
  });

  if (!generated.data) {
    console.log(`    ⚠ AI generation returned no data — skipping`);
    return false;
  }

  const payload: GeneratedArticlePayload = generated.data;

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

  await prisma.$transaction(async (tx) => {
    await tx.citation.deleteMany({ where: { articleId: article.id } });

    await tx.article.update({
      where: { id: article.id },
      data: {
        title: payload.title,
        summary: payload.summary,
        bodyMarkdown: payload.bodyMarkdown,
        isAIGenerated: true,
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

  console.log(`    ✓ Content regenerated (${allCitations.length} citations)`);
  return true;
}

async function enrichArticle(article: { id: string; slug: string; title: string; bodyMarkdown: string }) {
  const needsContent = article.bodyMarkdown.length < MIN_AI_BODY_LENGTH;

  if (needsContent) {
    console.log(`  ⚡ "${article.title}" — needs content regeneration (${article.bodyMarkdown.length} chars)`);
    const ok = await regenerateContent(article);
    if (!ok) return false;
  } else {
    console.log(`  ✓ "${article.title}" — content OK (${article.bodyMarkdown.length} chars)`);
  }

  // Clear old enrichment data
  await prisma.$transaction(async (tx) => {
    await tx.articleRelatedLink.deleteMany({ where: { sourceArticleId: article.id } });
    if (await tx.articleMetadata.findUnique({ where: { articleId: article.id } })) {
      await tx.articleMetadata.delete({ where: { articleId: article.id } });
    }
    await tx.councilRun.deleteMany({ where: { articleId: article.id } });
    await tx.reviewAlert.deleteMany({ where: { articleId: article.id } });
  });

  console.log(`    [1/3] Enriching metadata...`);
  await enrichArticleMetadata(article.id);

  console.log(`    [2/3] Rebuilding related graph...`);
  await rebuildRelatedGraph(article.id);

  console.log(`    [3/3] Running council scoring...`);
  const council = await runCouncilForArticle(article.id);
  if (council) {
    console.log(
      `    ✓ Trust: ${council.trustScore} | ${council.confidenceLabel} | Publish: ${council.publishEligible}`,
    );
  } else {
    console.log(`    ⚠ Council scoring failed`);
  }

  return true;
}

async function main() {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    process.exit(1);
  }
  console.log(`\nRe-enriching articles (model: ${model}, maxOutputTokens: 2048)`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, title: true, bodyMarkdown: true },
    orderBy: { title: "asc" },
  });

  const needsContent = articles.filter((a) => a.bodyMarkdown.length < MIN_AI_BODY_LENGTH);
  const hasContent = articles.filter((a) => a.bodyMarkdown.length >= MIN_AI_BODY_LENGTH);

  console.log(`Found ${articles.length} articles:`);
  console.log(`  ${hasContent.length} have AI content — will re-enrich`);
  console.log(`  ${needsContent.length} need content regeneration — will regenerate + enrich\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY);
    console.log(`\n--- Batch ${Math.floor(i / CONCURRENCY) + 1} ---`);

    const results = await Promise.allSettled(batch.map((a) => enrichArticle(a)));

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

  // Wire up related article IDs
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
  console.log(`Re-enrichment complete!`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Related links wired: ${wired}`);
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
