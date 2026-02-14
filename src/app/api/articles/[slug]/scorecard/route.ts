import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleArticleWhere } from "@/lib/services/articles";
import { latestCouncilRunForArticle } from "@/lib/services/council";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const session = await auth();

  const article = await prisma.article.findFirst({
    where: visibleArticleWhere({
      slug,
      viewerId: session?.user?.id,
      viewerRole: session?.user?.role,
    }),
    select: {
      id: true,
      slug: true,
      title: true,
      trustScore: true,
      confidenceLabel: true,
      evidenceScore: true,
      freshnessScore: true,
      consensusScore: true,
      trustBreakdownJson: true,
      updatedAt: true,
    },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const councilRun = await latestCouncilRunForArticle(article.id);
  return NextResponse.json({
    data: {
      article,
      councilRun: councilRun
        ? {
            id: councilRun.id,
            createdAt: councilRun.createdAt,
            aggregateScore: councilRun.aggregateScore,
            publishEligible: councilRun.publishEligible,
            breakdown: councilRun.breakdownJson,
            judges: councilRun.judgeResults.map((judge) => ({
              judgeName: judge.judgeName,
              score: judge.score,
              verdict: judge.verdict,
              rationale: judge.rationale,
            })),
          }
        : null,
    },
  });
}
