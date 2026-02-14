import Link from "next/link";
import { Search, Wand2, BookPlus } from "lucide-react";

import { ArticleCard } from "@/components/article-card";
import { listPublishedArticlesPaginated, type SortOption } from "@/lib/services/articles";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LumiTooltip } from "@/components/lumi-tooltip";

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
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] animate-pulse-slow rounded-full bg-teal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] animate-pulse-slow rounded-full bg-amber-500/10 blur-3xl [animation-delay:2s]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Knowledge council enabled
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Trusted health knowledge powered by{" "}
            <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
              <LumiTooltip>Lumi</LumiTooltip> and always-on review agents.
            </span>
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
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{result.totalCount} published articles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal-500" />
              <span>Council-verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Continuously reviewed</span>
            </div>
          </div>
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
        q ? (
          <section className="mt-8 rounded-2xl border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No results found</h2>
              <p className="text-sm text-muted-foreground">
                No published articles matching &ldquo;{q}&rdquo;
              </p>
              <Link
                href={`/articles/${q.trim().toLowerCase().replace(/\s+/g, "-")}?from=search`}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Wand2 className="h-4 w-4" />
                Generate &ldquo;{q.trim()}&rdquo; with Lumi
              </Link>
              <p className="text-xs text-muted-foreground">
                Lumi will create an evidence-based article and run council quality scoring.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <BookPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No articles yet</h2>
              <p className="text-sm text-muted-foreground">
                Run migrations, seed data, then publish your first reviewed article.
              </p>
            </div>
          </section>
        )
      )}
    </div>
  );
}
