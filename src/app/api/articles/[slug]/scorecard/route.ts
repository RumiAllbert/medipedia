import { ArticleStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { latestCouncilRunForArticle } from "@/lib/services/council";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const session = await auth();
  const includeDrafts = hasRole(session?.user?.role, Role.CONTRIBUTOR);
  const viewerId = session?.user?.id;

  const article = await prisma.article.findFirst({
    where: {
      slug,
      ...(includeDrafts
        ? {}
        : {
            OR: [
              { status: ArticleStatus.PUBLISHED },
              ...(viewerId
                ? [
                    {
                      status: ArticleStatus.AI_DRAFT,
                      createdById: viewerId,
                    },
                  ]
                : []),
            ],
          }),
    },
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
