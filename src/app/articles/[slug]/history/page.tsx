import { notFound } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type HistoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
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
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
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
