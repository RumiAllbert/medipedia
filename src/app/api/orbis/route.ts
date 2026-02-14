import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OrbisNode, OrbisEdge, OrbisGraphData } from "@/types/orbis";

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    select: {
      id: true,
      slug: true,
      title: true,
      trustScore: true,
      confidenceLabel: true,
      metadata: { select: { tags: true } },
      outgoingRelated: {
        select: {
          targetSlug: true,
          targetTitle: true,
          score: true,
          targetArticle: { select: { id: true, status: true } },
        },
      },
    },
  });

  const nodes: OrbisNode[] = [];
  const edges: OrbisEdge[] = [];
  const tagCounts = new Map<string, number>();
  const articleIds = new Set(articles.map((a) => a.id));

  // First pass: count tags
  for (const article of articles) {
    const tags = article.metadata?.tags as string[] | null;
    if (!tags) continue;
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  // Build tag nodes
  for (const [tag, count] of tagCounts) {
    nodes.push({
      id: `tag:${tag}`,
      type: "tag",
      label: tag,
      articleCount: count,
    });
  }

  // Build article nodes + edges
  for (const article of articles) {
    nodes.push({
      id: article.id,
      type: "article",
      label: article.title,
      slug: article.slug,
      trustScore: article.trustScore,
      confidenceLabel: article.confidenceLabel,
    });

    // Tag → article edges
    const tags = article.metadata?.tags as string[] | null;
    if (tags) {
      for (const tag of tags) {
        edges.push({
          id: `tag:${tag}→${article.id}`,
          source: `tag:${tag}`,
          target: article.id,
          type: "tag-article",
        });
      }
    }

    // Article → article edges (only where target is also published)
    for (const rel of article.outgoingRelated) {
      if (
        rel.targetArticle &&
        rel.targetArticle.status === ArticleStatus.PUBLISHED &&
        articleIds.has(rel.targetArticle.id)
      ) {
        edges.push({
          id: `${article.id}→${rel.targetArticle.id}`,
          source: article.id,
          target: rel.targetArticle.id,
          type: "article-article",
          score: rel.score,
        });
      }
    }
  }

  const data: OrbisGraphData = { nodes, edges };
  return NextResponse.json({ data });
}
