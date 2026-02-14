import { NextRequest, NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const synonymAliases: Record<string, string[]> = {
  "heart attack": ["myocardial infarction", "mi"],
  "high blood pressure": ["hypertension"],
  "low blood sugar": ["hypoglycemia"],
  "high blood sugar": ["hyperglycemia"],
  stroke: ["cerebrovascular accident", "cva"],
  "kidney failure": ["renal failure", "chronic kidney disease", "ckd"],
  "acid reflux": ["gastroesophageal reflux disease", "gerd"],
  flu: ["influenza"],
};

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function queryVariants(query: string): string[] {
  const q = normalize(query);
  const variants = new Set<string>([q]);

  for (const [alias, terms] of Object.entries(synonymAliases)) {
    if (q.includes(alias)) {
      terms.forEach((term) => variants.add(term));
    }
    if (terms.some((term) => q.includes(term))) {
      variants.add(alias);
      terms.forEach((term) => variants.add(term));
    }
  }

  return Array.from(variants);
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)),
  );

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function fuzzySimilarityScore(query: string, haystack: string): number {
  const q = normalize(query);
  const text = normalize(haystack);
  if (!q || !text) return 0;
  if (text.includes(q)) return 1;

  const distance = levenshteinDistance(q, text.slice(0, Math.max(q.length, 24)));
  const normalizer = Math.max(q.length, 1);
  return Math.max(0, 1 - distance / normalizer);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const variants = queryVariants(q);

  const directMatches = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      OR: variants.flatMap((variant) => [
        { title: { contains: variant, mode: "insensitive" } },
        { summary: { contains: variant, mode: "insensitive" } },
      ]),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      trustScore: true,
      status: true,
      publishedAt: true,
    },
    take: 30,
    orderBy: [{ trustScore: "desc" }, { publishedAt: "desc" }],
  });

  const fuzzyCandidates = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      trustScore: true,
      status: true,
      publishedAt: true,
    },
    take: 120,
    orderBy: [{ trustScore: "desc" }, { publishedAt: "desc" }],
  });

  const scored = new Map<string, (typeof directMatches)[number] & { score: number }>();

  for (const article of directMatches) {
    const titleScore = Math.max(...variants.map((variant) => fuzzySimilarityScore(variant, article.title)));
    const summaryScore = Math.max(...variants.map((variant) => fuzzySimilarityScore(variant, article.summary)));
    scored.set(article.id, {
      ...article,
      score: 0.7 + Math.max(titleScore, summaryScore) * 0.3,
    });
  }

  for (const article of fuzzyCandidates) {
    if (scored.has(article.id)) continue;

    const titleScore = Math.max(...variants.map((variant) => fuzzySimilarityScore(variant, article.title)));
    const summaryScore = Math.max(...variants.map((variant) => fuzzySimilarityScore(variant, article.summary)));
    const fuzzyScore = titleScore * 0.7 + summaryScore * 0.3;

    // Fuzzy matching hook: allow near-miss spellings and synonym-expanded candidates.
    if (fuzzyScore >= 0.45) {
      scored.set(article.id, {
        ...article,
        score: fuzzyScore,
      });
    }
  }

  const data = Array.from(scored.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
      return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
    })
    .slice(0, 8)
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      trustScore: article.trustScore,
      status: article.status,
    }));

  return NextResponse.json({ data });
}
