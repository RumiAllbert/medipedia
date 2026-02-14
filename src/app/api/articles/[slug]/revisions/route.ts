import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  const article = await prisma.article.findUnique({
    where: { slug },
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
