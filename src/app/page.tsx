import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

import { ArticleCard } from "@/components/article-card";
import { listPublishedArticlesPaginated, type SortOption } from "@/lib/services/articles";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    sort?: SortOption;
    cursor?: string;
  }>;
};

async function getPopularTags() {
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
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag);
}

export default async function Home({ searchParams }: HomeProps) {
  const { q, tag, sort, cursor } = await searchParams;

  const [result, popularTags] = await Promise.all([
    listPublishedArticlesPaginated({ query: q, tag, sort, cursor }),
    getPopularTags(),
  ]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "trust", label: "Highest trust" },
    { value: "alphabetical", label: "A-Z" },
  ];

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (params.q ?? q) sp.set("q", (params.q ?? q)!);
    if (params.tag ?? tag) sp.set("tag", (params.tag ?? tag)!);
    if (params.sort ?? sort) sp.set("sort", (params.sort ?? sort)!);
    if (params.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.08),transparent_45%),radial-gradient(circle_at_left,rgba(245,158,11,0.07),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.15),transparent_45%),radial-gradient(circle_at_left,rgba(245,158,11,0.1),transparent_40%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Knowledge council enabled
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
            Trusted health knowledge powered by Lumi and always-on review agents.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Every article publishes with explainable scoring, citation tiers, and continuous
            re-review scheduling.
          </p>
          <form className="mt-6 flex flex-col gap-2 sm:flex-row" action="/" method="GET">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search symptoms, conditions, treatments..."
                className="pl-10"
              />
            </div>
            {tag && <input type="hidden" name="tag" value={tag} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      {/* Tag filter chips */}
      {popularTags.length > 0 && (
        <section className="mt-6 flex flex-wrap gap-2">
          <Link href={buildUrl({ tag: undefined }).replace(/[?&]tag=[^&]*/g, "")}>
            <Badge
              variant={!tag ? "default" : "outline"}
              className="cursor-pointer"
            >
              All
            </Badge>
          </Link>
          {popularTags.map((t) => (
            <Link key={t} href={buildUrl({ tag: t, cursor: undefined })}>
              <Badge
                variant={tag === t ? "default" : "outline"}
                className="cursor-pointer"
              >
                {t}
              </Badge>
            </Link>
          ))}
        </section>
      )}

      {/* Sort + count bar */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {result.totalCount} article{result.totalCount !== 1 ? "s" : ""}
          {q && <> matching &ldquo;{q}&rdquo;</>}
          {tag && <> tagged &ldquo;{tag}&rdquo;</>}
        </p>
        <div className="flex gap-1">
          {sortOptions.map((opt) => (
            <Link key={opt.value} href={buildUrl({ sort: opt.value, cursor: undefined })}>
              <Button
                variant={(sort ?? "newest") === opt.value ? "default" : "outline"}
                size="sm"
              >
                {opt.label}
              </Button>
            </Link>
          ))}
        </div>
      </section>

      {/* Article grid */}
      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {result.items.map((article) => (
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

      {/* Pagination */}
      {result.hasMore && result.nextCursor && (
        <div className="mt-8 flex justify-center">
          <Link href={buildUrl({ cursor: result.nextCursor })}>
            <Button variant="outline">Load more</Button>
          </Link>
        </div>
      )}

      {result.items.length === 0 && (
        <section className="mt-8 rounded-2xl border bg-card p-8 text-center shadow-sm">
          {q ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                No published articles matching &ldquo;{q}&rdquo;
              </p>
              <Link
                href={`/articles/${q.trim().toLowerCase().replace(/\s+/g, "-")}?from=search`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" />
                Generate &ldquo;{q.trim()}&rdquo; with Lumi
              </Link>
              <p className="text-xs text-muted-foreground">
                Lumi will create an evidence-based article and run council quality scoring.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No published articles yet. Run migrations, seed data, then publish your first reviewed
              article.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
