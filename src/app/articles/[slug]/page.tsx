import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArticleStatus } from "@prisma/client";
import { History, ExternalLink } from "lucide-react";

import { auth } from "@/lib/auth";
import { ArticleListen } from "@/components/article-listen";
import { MissingArticleGate } from "@/components/missing-article-gate";
import { Breadcrumb } from "@/components/breadcrumb";
import { ReportIssueDialog } from "@/components/report-issue-dialog";
import { TableOfContents } from "@/components/table-of-contents";
import { TrustTimeline } from "@/components/trust-timeline";
import { TrustScorecard } from "@/components/trust-scorecard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { featureFlags } from "@/lib/feature-flags";
import { getArticleTimeline } from "@/lib/services/article-timeline";
import { getVisibleArticleBySlug } from "@/lib/services/articles";
import { ShareButton } from "@/components/share-button";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
};

const tierColors: Record<string, string> = {
  A: "success",
  B: "warning",
  C: "destructive",
};

function headingId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function urlHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const { slug } = await params;
  const { from } = await searchParams;
  const session = await auth();
  const article = await getVisibleArticleBySlug({
    slug,
    viewerId: session?.user?.id,
    viewerRole: session?.user?.role,
  });

  if (!article) {
    return <MissingArticleGate slug={slug} from={from} />;
  }

  const draft = article.status !== ArticleStatus.PUBLISHED;
  const trustBreakdown = (article.trustBreakdownJson as Record<string, unknown> | null) ?? null;
  const sourceGate = (trustBreakdown?.sourceGate as Record<string, unknown> | undefined) ?? undefined;
  const citationDomains =
    (sourceGate?.citationDomains as
      | Array<{ domain: string; tier: string | null; enabled: boolean | null }>
      | undefined) ?? [];

  const tags = (article.metadata?.tags as string[] | null) ?? [];
  const freshnessBadges = article.citations.map((citation) => ({
    label: urlHostname(citation.url),
    days: citation.freshnessDays,
  }));
  const evidenceTierSummary = citationDomains.reduce(
    (acc, item) => {
      if (item.tier === "A") acc.tierA += 1;
      else if (item.tier === "B") acc.tierB += 1;
      else if (item.tier === "C") acc.tierC += 1;
      else acc.unknown += 1;
      return acc;
    },
    { tierA: 0, tierB: 0, tierC: 0, unknown: 0 },
  );
  const timeline = featureFlags.trustTimeline ? await getArticleTimeline(article.id) : null;
  const latestPromptRun = article.promptRuns[0] ?? null;
  const latestCouncilRun = article.councilRuns[0] ?? null;
  const promptModels = Array.from(new Set(article.promptRuns.map((run) => run.model)));

  return (
    <article className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Articles", href: "/" },
          { label: article.title },
        ]}
      />

      {/* Header */}
      <header className="mt-6 rounded-3xl border bg-card p-7 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={article.status === ArticleStatus.PUBLISHED ? "success" : "warning"}>
            {article.status}
          </Badge>
          <Badge variant="neutral">{article.confidenceLabel}</Badge>
          <Badge variant="secondary">Trust {article.trustScore}/100</Badge>
          {article.isAIGenerated && <Badge variant="warning">Lumi draft</Badge>}
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{article.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{article.summary}</p>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link key={tag} href={`/topics/${encodeURIComponent(tag)}`}>
                <Badge variant="outline" className="cursor-pointer">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ArticleListen title={article.title} summary={article.summary} markdown={article.bodyMarkdown} />
          <ShareButton />
          {featureFlags.articleReporting && <ReportIssueDialog slug={slug} />}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/articles/${slug}/history`}>
              <History className="mr-2 h-3.5 w-3.5" />
              History
            </Link>
          </Button>
        </div>

        {draft && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Draft status: this article is still under editorial review.
          </p>
        )}
      </header>

      {/* Content + sidebar */}
      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main content */}
        <div className="rounded-3xl border bg-card p-7 shadow-sm">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => {
                const text = String(children);
                return (
                  <h2
                    id={headingId(text)}
                    className="mt-8 scroll-mt-20 text-2xl font-semibold tracking-tight"
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => {
                const text = String(children);
                return (
                  <h3
                    id={headingId(text)}
                    className="mt-6 scroll-mt-20 text-xl font-semibold tracking-tight"
                  >
                    {children}
                  </h3>
                );
              },
              p: ({ children }) => (
                <p className="mt-3 leading-8 text-muted-foreground">{children}</p>
              ),
              li: ({ children }) => (
                <li className="ml-5 list-disc text-muted-foreground">{children}</li>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {children}
                </a>
              ),
            }}
          >
            {article.bodyMarkdown}
          </Markdown>

          {article.claims.length > 0 && (
            <section className="mt-10 space-y-3">
              <h3 className="text-xl font-semibold tracking-tight">Claim Traceability</h3>
              {article.claims.map((claim) => (
                <div key={claim.id} className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{claim.sectionHeading}</Badge>
                    <Badge variant="neutral">Confidence {claim.confidence}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{claim.claimText}</p>
                  {claim.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {claim.citations.map((reference) => (
                        <a
                          key={reference.id}
                          href={reference.citation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition hover:bg-accent"
                        >
                          {reference.citation.title}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* TOC - sticky */}
          <div className="sticky top-20">
            <Card>
              <CardContent className="pt-6">
                <TableOfContents markdown={article.bodyMarkdown} />
              </CardContent>
            </Card>

            <div className="mt-4">
              <TrustScorecard
                trustScore={article.trustScore}
                evidenceScore={article.evidenceScore}
                freshnessScore={article.freshnessScore}
                consensusScore={article.consensusScore}
                confidenceLabel={article.confidenceLabel}
                lastReviewedAt={article.lastReviewedAt}
                nextReviewAt={article.nextReviewAt}
                freshnessBadges={freshnessBadges}
                evidenceTierSummary={evidenceTierSummary}
              />
            </div>

            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Prompt & Model Provenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Latest prompt run:{" "}
                  {latestPromptRun
                    ? `${latestPromptRun.templateKey} v${latestPromptRun.templateVersion}`
                    : "Not recorded"}
                </p>
                <p>
                  Latest council prompt version: {latestCouncilRun?.promptVersion ?? "Not recorded"}
                </p>
                <p>
                  Latest council policy version: {latestCouncilRun?.policyVersion ?? "Not recorded"}
                </p>
                <p>Models observed: {promptModels.length > 0 ? promptModels.join(", ") : "Not recorded"}</p>
              </CardContent>
            </Card>

            {timeline && (
              <div className="mt-4">
                <TrustTimeline events={timeline.events} />
              </div>
            )}

            {/* Source tiers */}
            {citationDomains.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Evidence Source Tiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {citationDomains.map((entry) => (
                    <div key={entry.domain} className="rounded-lg bg-muted p-2.5">
                      <p className="text-sm font-medium">{entry.domain}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant={
                            (tierColors[entry.tier ?? ""] as "success" | "warning" | "destructive") ?? "neutral"
                          }
                          className="text-[10px]"
                        >
                          Tier {entry.tier ?? "?"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {entry.enabled === false ? "Blocked" : "Allowed"}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Key facts */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Key Facts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(article.metadata?.keyFacts as string[] | null)?.map((fact) => (
                    <li key={fact} className="flex gap-2">
                      <span className="shrink-0 text-primary">&#8226;</span>
                      {fact}
                    </li>
                  )) ?? <li>Metadata enrichment pending.</li>}
                </ul>
              </CardContent>
            </Card>

            {/* Related content */}
            {article.outgoingRelated.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Related Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    {article.outgoingRelated.map((item) => (
                      <li key={item.id}>
                        <Link
                          className="font-medium transition hover:text-primary/80"
                          href={`/articles/${item.targetSlug}?from=${article.slug}`}
                        >
                          {item.targetTitle}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Citations */}
            {article.citations.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Citations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {article.citations.map((citation) => (
                      <li key={citation.id}>
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-medium transition hover:text-primary/80"
                        >
                          {citation.title}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <p className="text-xs text-muted-foreground">{citation.sourceType}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </aside>
      </section>
    </article>
  );
}
