import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleArticleWhere } from "@/lib/services/articles";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const session = await auth();

  const article = await prisma.article.findFirst({
    where: visibleArticleWhere({
      slug,
      viewerId: session?.user?.id,
      viewerRole: session?.user?.role,
    }),
    select: { id: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const revisions = await prisma.articleRevision.findMany({
    where: {
      articleId: article.id,
    },
    select: {
      version: true,
      status: true,
      createdBy: true,
      createdAt: true,
      notes: true,
    },
    orderBy: {
      version: "desc",
    },
  });

  return NextResponse.json({ data: revisions });
}
