import { notFound } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleArticleWhere } from "@/lib/services/articles";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type HistoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ left?: string; right?: string }>;
};

type DiffRow = {
  left: string;
  right: string;
  type: "same" | "removed" | "added" | "changed";
};

function buildLineDiff(leftMarkdown: string, rightMarkdown: string): DiffRow[] {
  const leftLines = leftMarkdown.split("\n");
  const rightLines = rightMarkdown.split("\n");

  const rows: DiffRow[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < leftLines.length || rightIndex < rightLines.length) {
    const leftLine = leftLines[leftIndex];
    const rightLine = rightLines[rightIndex];

    if (leftLine === rightLine) {
      rows.push({ left: leftLine ?? "", right: rightLine ?? "", type: "same" });
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }

    const nextLeft = leftLines[leftIndex + 1];
    const nextRight = rightLines[rightIndex + 1];

    if (nextLeft === rightLine) {
      rows.push({ left: leftLine ?? "", right: "", type: "removed" });
      leftIndex += 1;
      continue;
    }

    if (leftLine === nextRight) {
      rows.push({ left: "", right: rightLine ?? "", type: "added" });
      rightIndex += 1;
      continue;
    }

    rows.push({ left: leftLine ?? "", right: rightLine ?? "", type: "changed" });
    leftIndex += 1;
    rightIndex += 1;
  }

  return rows;
}

function rowClasses(type: DiffRow["type"]): string {
  if (type === "added") return "bg-emerald-50 dark:bg-emerald-950/20";
  if (type === "removed") return "bg-rose-50 dark:bg-rose-950/20";
  if (type === "changed") return "bg-amber-50 dark:bg-amber-950/20";
  return "";
}

export default async function HistoryPage({ params, searchParams }: HistoryPageProps) {
  const { slug } = await params;
  const { left, right } = await searchParams;
  const session = await auth();

  const article = await prisma.article.findFirst({
    where: visibleArticleWhere({
      slug,
      viewerId: session?.user?.id,
      viewerRole: session?.user?.role,
    }),
    select: { id: true, title: true, slug: true },
  });

  if (!article) notFound();

  const revisions = await prisma.articleRevision.findMany({
    where: { articleId: article.id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      status: true,
      createdBy: true,
      createdAt: true,
      notes: true,
      contentMarkdown: true,
    },
  });

  const leftVersion = Number(left ?? revisions[1]?.version ?? revisions[0]?.version ?? 0);
  const rightVersion = Number(right ?? revisions[0]?.version ?? 0);

  const leftRevision = revisions.find((revision) => revision.version === leftVersion) ?? revisions[1] ?? revisions[0];
  const rightRevision = revisions.find((revision) => revision.version === rightVersion) ?? revisions[0];

  const diffRows = leftRevision && rightRevision
    ? buildLineDiff(leftRevision.contentMarkdown, rightRevision.contentMarkdown)
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: article.title, href: `/articles/${article.slug}` },
          { label: "History" },
        ]}
      />

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Revision History</h1>
      <p className="mt-1 text-muted-foreground">
        {revisions.length} revision{revisions.length !== 1 ? "s" : ""} for &ldquo;{article.title}&rdquo;
      </p>

      {leftRevision && rightRevision && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              Side-by-side diff: v{leftRevision.version} → v{rightRevision.version}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Left is the earlier revision, right is the selected newer revision.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border p-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Left (v{leftRevision.version})</p>
                <p>{new Date(leftRevision.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Right (v{rightRevision.version})</p>
                <p>{new Date(rightRevision.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border">
              <div className="min-w-[720px]">
                {diffRows.map((row, index) => (
                  <div key={index} className={`grid grid-cols-2 border-b text-xs ${rowClasses(row.type)}`}>
                    <pre className="overflow-x-auto border-r px-3 py-1.5 whitespace-pre-wrap">{row.left}</pre>
                    <pre className="overflow-x-auto px-3 py-1.5 whitespace-pre-wrap">{row.right}</pre>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 space-y-3">
        {revisions.map((rev) => (
          <Card key={rev.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Version {rev.version}</span>
                  <Badge variant="neutral" className="text-[10px]">
                    {rev.status}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span>By {rev.createdBy}</span>
                  <span className="mx-2">·</span>
                  <span>{new Date(rev.createdAt).toLocaleString()}</span>
                </div>
                {rev.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">{rev.notes}</p>
                )}
              </div>

              {rightRevision && rev.version !== rightRevision.version && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/articles/${article.slug}/history?left=${rev.version}&right=${rightRevision.version}`}>
                    Compare to v{rightRevision.version}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href={`/articles/${article.slug}`}>Back to article</Link>
        </Button>
      </div>
    </div>
  );
}
