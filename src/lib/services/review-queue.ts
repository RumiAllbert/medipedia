import { ArticleStatus, ReviewAlertStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { calculateReviewRiskScore } from "@/lib/services/review-risk";

export type ReviewQueueItem = {
  articleId: string;
  slug: string;
  title: string;
  trustScore: number;
  freshnessScore: number;
  confidenceLabel: string;
  pendingSince: Date;
  updatedAt: Date;
  openAlertCount: number;
  riskScore: number;
  riskBreakdown: {
    trustDropMagnitude: number;
    lowFreshnessPenalty: number;
    openAlertsPenalty: number;
    pendingAgePenalty: number;
  };
  authorEmail: string | null;
};

export async function getRiskPrioritizedReviewQueue(): Promise<ReviewQueueItem[]> {
  const pendingArticles = await prisma.article.findMany({
    where: { status: ArticleStatus.PENDING_REVIEW },
    include: {
      createdByUser: { select: { email: true } },
      reviewAlerts: {
        where: { status: ReviewAlertStatus.OPEN },
        select: {
          previousTrustScore: true,
          newTrustScore: true,
        },
      },
    },
  });

  const nowMs = Date.now();

  return pendingArticles
    .map((article) => {
      const trustDropMagnitude = article.reviewAlerts.reduce((maxDrop, alert) => {
        const drop = Math.max(0, alert.previousTrustScore - alert.newTrustScore);
        return Math.max(maxDrop, drop);
      }, 0);

      const pendingAgeHours = Math.max(0, (nowMs - article.updatedAt.getTime()) / (1000 * 60 * 60));

      const { riskScore, ...riskBreakdown } = calculateReviewRiskScore({
        trustDropMagnitude,
        freshnessScore: article.freshnessScore,
        openAlertCount: article.reviewAlerts.length,
        pendingAgeHours,
      });

      return {
        articleId: article.id,
        slug: article.slug,
        title: article.title,
        trustScore: article.trustScore,
        freshnessScore: article.freshnessScore,
        confidenceLabel: article.confidenceLabel,
        pendingSince: article.updatedAt,
        updatedAt: article.updatedAt,
        openAlertCount: article.reviewAlerts.length,
        riskScore,
        riskBreakdown,
        authorEmail: article.createdByUser?.email ?? null,
      } satisfies ReviewQueueItem;
    })
    .sort((a, b) => {
      if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    });
}
