import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function getAlerts() {
  const reviewAlerts = await prisma.reviewAlert.findMany({
    where: { status: "OPEN" },
    include: {
      article: { select: { slug: true, title: true, trustScore: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public."ContentReport"') IS NOT NULL AS "exists"
  `;
  const hasContentReportTable = tableCheck[0]?.exists === true;

  const contentReports = hasContentReportTable
    ? await prisma.contentReport.findMany({
        where: { status: "OPEN" },
        include: {
          article: { select: { slug: true, title: true } },
          reporter: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return { reviewAlerts, contentReports };
}

export default async function AlertsPage() {
  const { reviewAlerts, contentReports } = await getAlerts();

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">Review Alerts</h1>
      <p className="mt-1 text-muted-foreground">
        {reviewAlerts.length} open trust alert{reviewAlerts.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-6 space-y-3">
        {reviewAlerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <Link
                    href={`/articles/${alert.article.slug}`}
                    className="font-medium hover:underline"
                  >
                    {alert.article.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.reason}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Score: {alert.previousTrustScore} → {alert.newTrustScore}
                    </span>
                    <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/review/${alert.article.slug}`}>
                  Review
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {reviewAlerts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No open alerts. All articles are within expected trust score ranges.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">Open Content Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {contentReports.length} open report{contentReports.length !== 1 ? "s" : ""}
        </p>
        <div className="mt-4 space-y-3">
          {contentReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">
                    {report.type} · {report.article.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {report.reporter?.email ?? "Anonymous"} · {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/articles/${report.article.slug}`}>Open article</Link>
                </Button>
              </CardContent>
            </Card>
          ))}

          {contentReports.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No open content reports.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
