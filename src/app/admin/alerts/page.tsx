import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function getAlerts() {
  return prisma.reviewAlert.findMany({
    where: { status: "OPEN" },
    include: {
      article: { select: { slug: true, title: true, trustScore: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">Review Alerts</h1>
      <p className="mt-1 text-muted-foreground">
        {alerts.length} open alert{alerts.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-6 space-y-3">
        {alerts.map((alert) => (
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

        {alerts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No open alerts. All articles are within expected trust score ranges.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
