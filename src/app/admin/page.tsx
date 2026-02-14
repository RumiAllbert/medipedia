import { ArticleStatus } from "@prisma/client";
import { Users, FileText, Clock, AlertTriangle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getStats() {
  const [userCount, articlesByStatus, jobCount, alertCount] = await Promise.all([
    prisma.user.count(),
    prisma.article.groupBy({ by: ["status"], _count: true }),
    prisma.agentJob.count({ where: { status: "QUEUED" } }),
    prisma.reviewAlert.count({ where: { status: "OPEN" } }),
  ]);

  const statusMap = Object.fromEntries(
    articlesByStatus.map((g) => [g.status, g._count])
  );

  return {
    userCount,
    totalArticles: articlesByStatus.reduce((sum, g) => sum + g._count, 0),
    published: statusMap[ArticleStatus.PUBLISHED] ?? 0,
    pendingReview: statusMap[ArticleStatus.PENDING_REVIEW] ?? 0,
    drafts: (statusMap[ArticleStatus.DRAFT] ?? 0) + (statusMap[ArticleStatus.AI_DRAFT] ?? 0),
    queuedJobs: jobCount,
    openAlerts: alertCount,
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total users", value: stats.userCount, icon: Users },
    { label: "Total articles", value: stats.totalArticles, icon: FileText },
    { label: "Published", value: stats.published, icon: FileText },
    { label: "Pending review", value: stats.pendingReview, icon: Clock },
    { label: "Drafts", value: stats.drafts, icon: FileText },
    { label: "Queued jobs", value: stats.queuedJobs, icon: Clock },
    { label: "Open alerts", value: stats.openAlerts, icon: AlertTriangle },
  ];

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">Admin Overview</h1>
      <p className="mt-1 text-muted-foreground">System stats at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
