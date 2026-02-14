import { notFound, redirect } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { getArticleBySlug } from "@/lib/services/articles";
import { latestCouncilRunForArticle } from "@/lib/services/council";
import { TrustScorecard } from "@/components/trust-scorecard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/breadcrumb";
import { ReviewActions } from "./review-actions";

type ReviewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, Role.REVIEWER)) {
    redirect("/dashboard");
  }

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const council = await latestCouncilRunForArticle(article.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Review" },
        ]}
      />

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Review: {article.title}</h1>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant="warning">{article.status}</Badge>
        <Badge variant="secondary">Trust {article.trustScore}/100</Badge>
        {article.isAIGenerated && <Badge variant="warning">Lumi generated</Badge>}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Article preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{article.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="mt-6 text-2xl font-semibold tracking-tight">{children}</h2>
                  ),
                  p: ({ children }) => (
                    <p className="mt-3 leading-7 text-muted-foreground">{children}</p>
                  ),
                  li: ({ children }) => (
                    <li className="ml-5 list-disc text-muted-foreground">{children}</li>
                  ),
                }}
              >
                {article.bodyMarkdown}
              </Markdown>
            </CardContent>
          </Card>

          {/* Citations panel */}
          {article.citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Citations ({article.citations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {article.citations.map((c) => (
                    <li key={c.id} className="rounded-lg bg-muted p-3">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:underline"
                      >
                        {c.title}
                      </a>
                      <p className="text-xs text-muted-foreground">{c.sourceType}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <TrustScorecard
            trustScore={article.trustScore}
            evidenceScore={article.evidenceScore}
            freshnessScore={article.freshnessScore}
            consensusScore={article.consensusScore}
            confidenceLabel={article.confidenceLabel}
            lastReviewedAt={article.lastReviewedAt}
            nextReviewAt={article.nextReviewAt}
          />

          {/* Council judge results */}
          {council && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Council Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Aggregate Score</span>
                  <Badge variant={council.publishEligible ? "success" : "warning"}>
                    {council.aggregateScore}/100
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Publish eligible: {council.publishEligible ? "Yes" : "No"}
                </div>
                <Separator />
                {council.judgeResults.map((judge) => (
                  <div key={judge.id} className="rounded-lg bg-muted p-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{judge.judgeName}</span>
                      <span>{judge.score}/100</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{judge.verdict}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action panel */}
          <ReviewActions articleId={article.id} publishEligible={council?.publishEligible ?? false} />
        </aside>
      </div>
    </div>
  );
}
