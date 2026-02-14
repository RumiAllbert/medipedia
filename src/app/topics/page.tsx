import Link from "next/link";
import { ArticleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/breadcrumb";

async function getTagsWithCounts() {
  const metadata = await prisma.articleMetadata.findMany({
    where: { article: { status: ArticleStatus.PUBLISHED } },
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  for (const m of metadata) {
    const tags = m.tags as string[] | null;
    if (!tags) continue;
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function TopicsPage() {
  const tags = await getTagsWithCounts();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Topics" }]} />

      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Browse by Topic</h1>
      <p className="mt-2 text-muted-foreground">
        Explore health articles organized by category and topic.
      </p>

      {tags.length > 0 ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tags.map(({ tag, count }) => (
            <Link key={tag} href={`/topics/${encodeURIComponent(tag)}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tag}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    {count} article{count !== 1 ? "s" : ""}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No topics available yet. Articles need metadata enrichment to show tags.
        </section>
      )}
    </div>
  );
}
