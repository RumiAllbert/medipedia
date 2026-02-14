import Link from "next/link";
import { ArticleStatus, Role } from "@prisma/client";
import { NotebookPen, FileText, CheckCircle, Clock, Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function getUserArticles(userId: string) {
  return prisma.article.findMany({
    where: { createdById: userId },
    include: { metadata: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function getPendingReviews() {
  return prisma.article.findMany({
    where: { status: ArticleStatus.PENDING_REVIEW },
    include: { metadata: true, createdByUser: { select: { email: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

function statusVariant(status: ArticleStatus) {
  switch (status) {
    case ArticleStatus.PUBLISHED: return "success" as const;
    case ArticleStatus.PENDING_REVIEW: return "warning" as const;
    case ArticleStatus.REJECTED: return "destructive" as const;
    default: return "neutral" as const;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user!;
  const isReviewer = hasRole(user.role, Role.REVIEWER);

  const articles = await getUserArticles(user.id!);
  const pendingReviews = isReviewer ? await getPendingReviews() : [];

  const draftStatuses: ArticleStatus[] = [ArticleStatus.DRAFT, ArticleStatus.AI_DRAFT, ArticleStatus.REJECTED];
  const drafts = articles.filter((a) => draftStatuses.includes(a.status));
  const published = articles.filter((a) => a.status === ArticleStatus.PUBLISHED);
  const pending = articles.filter((a) => a.status === ArticleStatus.PENDING_REVIEW);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your articles and review submissions.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/editor">
            <Plus className="mr-2 h-4 w-4" />
            New article
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{published.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <NotebookPen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="drafts" className="mt-8">
        <TabsList>
          <TabsTrigger value="drafts">My Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="published">My Published ({published.length})</TabsTrigger>
          {isReviewer && (
            <TabsTrigger value="reviews">
              Pending Review ({pendingReviews.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="drafts">
          <ArticleList articles={drafts} showEdit />
        </TabsContent>
        <TabsContent value="published">
          <ArticleList articles={published} />
        </TabsContent>
        {isReviewer && (
          <TabsContent value="reviews">
            <ArticleList articles={pendingReviews} showReview />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

type ArticleListProps = {
  articles: Awaited<ReturnType<typeof getUserArticles | typeof getPendingReviews>>;
  showEdit?: boolean;
  showReview?: boolean;
};

function ArticleList({ articles, showEdit, showReview }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">No articles in this category</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first article to get started.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/dashboard/editor">
              <Plus className="mr-2 h-4 w-4" />
              New article
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {articles.map((article) => (
        <Card key={article.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/articles/${article.slug}`}
                  className="font-medium hover:underline"
                >
                  {article.title}
                </Link>
                <Badge variant={statusVariant(article.status)} className="text-[10px]">
                  {article.status}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Trust: {article.trustScore}/100</span>
                <span>Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/editor/${article.slug}`}>Edit</Link>
                </Button>
              )}
              {showReview && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/review/${article.slug}`}>Review</Link>
                </Button>
              )}
              {article.status === ArticleStatus.DRAFT && (
                <SubmitButton slug={article.slug} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SubmitButton({ slug }: { slug: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/articles/${slug}/submit`, {
          method: "POST",
        });
      }}
    >
      <Button type="submit" variant="secondary" size="sm">
        Submit for review
      </Button>
    </form>
  );
}
