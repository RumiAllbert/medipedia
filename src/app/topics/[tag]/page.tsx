import { ArticleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { articleInclude } from "@/lib/services/articles";
import { ArticleCard } from "@/components/article-card";
import { Breadcrumb } from "@/components/breadcrumb";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  const articles = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      metadata: {
        tags: { array_contains: [decodedTag] },
      },
    },
    include: articleInclude,
    orderBy: [{ trustScore: "desc" }, { publishedAt: "desc" }],
    take: 30,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Topics", href: "/topics" },
          { label: decodedTag },
        ]}
      />

      <h1 className="mt-6 text-4xl font-semibold tracking-tight">{decodedTag}</h1>
      <p className="mt-2 text-muted-foreground">
        {articles.length} article{articles.length !== 1 ? "s" : ""} tagged with &ldquo;
        {decodedTag}&rdquo;
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            slug={article.slug}
            title={article.title}
            summary={article.summary}
            trustScore={article.trustScore}
            confidenceLabel={article.confidenceLabel}
            status={article.status}
            tags={(article.metadata?.tags as string[] | null) ?? undefined}
          />
        ))}
      </section>

      {articles.length === 0 && (
        <section className="mt-8 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No published articles with this tag yet.
        </section>
      )}
    </div>
  );
}
