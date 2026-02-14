import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { getVisibleArticleBySlug } from "@/lib/services/articles";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guard";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const session = await auth();
  const includeDrafts = hasRole(session?.user?.role, Role.CONTRIBUTOR);
  const article = await getVisibleArticleBySlug({
    slug,
    includeDrafts,
    viewerId: session?.user?.id,
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: article });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authz = await requireRole(Role.CONTRIBUTOR);
  if (!authz.ok) return authz.response;

  const { slug } = await params;
  const body = await request.json();
  const { title, summary, bodyMarkdown } = body;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      revisions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const user = authz.session.user;
  if (article.createdById !== user.id && user.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "Forbidden: You are not the author of this article" },
      { status: 403 }
    );
  }

  const latestVersion = article.revisions[0]?.version ?? 0;

  const updatedArticle = await prisma.article.update({
    where: { id: article.id },
    data: {
      title: title ?? article.title,
      summary: summary ?? article.summary,
      bodyMarkdown: bodyMarkdown ?? article.bodyMarkdown,
    },
  });

  await prisma.articleRevision.create({
    data: {
      articleId: article.id,
      version: latestVersion + 1,
      contentMarkdown: bodyMarkdown ?? article.bodyMarkdown,
      status: article.status,
      createdBy: user.email ?? "contributor",
    },
  });

  return NextResponse.json({ data: updatedArticle });
}
