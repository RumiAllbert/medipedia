import { prisma } from "@/lib/prisma";

export type TimelineEvent =
  | {
      type: "COUNCIL_RUN";
      id: string;
      createdAt: Date;
      title: string;
      details: string;
      severity: "success" | "warning" | "destructive" | "neutral";
    }
  | {
      type: "REVIEW_ALERT";
      id: string;
      createdAt: Date;
      title: string;
      details: string;
      severity: "warning" | "destructive";
    }
  | {
      type: "REVIEW_DECISION";
      id: string;
      createdAt: Date;
      title: string;
      details: string;
      severity: "success" | "warning" | "destructive";
    };

export type ArticleTimelinePayload = {
  councilRuns: Array<{
    id: string;
    createdAt: Date;
    aggregateScore: number;
    publishEligible: boolean;
    promptVersion: string | null;
    policyVersion: string | null;
    scoreDelta: number | null;
  }>;
  reviewAlerts: Array<{
    id: string;
    createdAt: Date;
    reason: string;
    status: string;
    previousTrustScore: number;
    newTrustScore: number;
    delta: number;
  }>;
  reviewDecisions: Array<{
    id: string;
    createdAt: Date;
    decision: string;
    reviewerEmail: string | null;
    notes: string;
  }>;
  events: TimelineEvent[];
};

export async function getArticleTimeline(articleId: string): Promise<ArticleTimelinePayload> {
  const [councilRunsRaw, reviewAlerts, reviewDecisions] = await Promise.all([
    prisma.councilRun.findMany({
      where: { articleId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        aggregateScore: true,
        publishEligible: true,
        promptVersion: true,
        policyVersion: true,
      },
    }),
    prisma.reviewAlert.findMany({
      where: { articleId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        reason: true,
        status: true,
        previousTrustScore: true,
        newTrustScore: true,
      },
    }),
    prisma.review.findMany({
      where: { articleId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        decision: true,
        notes: true,
        reviewer: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  const councilRuns = councilRunsRaw.map((run, index) => ({
    ...run,
    scoreDelta: index > 0 ? run.aggregateScore - councilRunsRaw[index - 1].aggregateScore : null,
  }));

  const eventRows: TimelineEvent[] = [
    ...councilRuns.map((run) => {
      const severity = !run.publishEligible
        ? "warning"
        : run.aggregateScore >= 80
          ? "success"
          : run.aggregateScore >= 65
            ? "warning"
            : "destructive";
      const deltaText = run.scoreDelta == null ? "Initial run" : `${run.scoreDelta >= 0 ? "+" : ""}${run.scoreDelta}`;

      return {
        type: "COUNCIL_RUN",
        id: run.id,
        createdAt: run.createdAt,
        title: `Council run scored ${run.aggregateScore}/100`,
        details: `${deltaText}. ${run.publishEligible ? "Publish-eligible" : "Blocked by council gate"}.`,
        severity,
      } satisfies TimelineEvent;
    }),
    ...reviewAlerts.map((alert) => {
      const delta = alert.newTrustScore - alert.previousTrustScore;
      return {
        type: "REVIEW_ALERT",
        id: alert.id,
        createdAt: alert.createdAt,
        title: "Review alert raised",
        details: `${alert.reason} (${delta >= 0 ? "+" : ""}${delta})`,
        severity: delta < 0 ? "destructive" : "warning",
      } satisfies TimelineEvent;
    }),
    ...reviewDecisions.map((review) => ({
      type: "REVIEW_DECISION",
      id: review.id,
      createdAt: review.createdAt,
      title: `Reviewer marked ${review.decision}`,
      details: review.reviewer.email ? `By ${review.reviewer.email}` : "Reviewer identity unavailable",
      severity:
        review.decision === "APPROVED"
          ? "success"
          : review.decision === "REQUEST_CHANGES"
            ? "warning"
            : "destructive",
    }) satisfies TimelineEvent),
  ];

  eventRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    councilRuns: councilRuns.slice().reverse(),
    reviewAlerts: reviewAlerts.map((alert) => ({
      ...alert,
      delta: alert.newTrustScore - alert.previousTrustScore,
    })),
    reviewDecisions: reviewDecisions.map((review) => ({
      id: review.id,
      createdAt: review.createdAt,
      decision: review.decision,
      reviewerEmail: review.reviewer.email,
      notes: review.notes,
    })),
    events: eventRows,
  };
}
