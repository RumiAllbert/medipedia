import { NextRequest, NextResponse } from "next/server";
import { Role, ArticleStatus, ReviewDecision } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guard";

type RouteContext = { params: Promise<{ articleId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const authz = await requireRole(Role.REVIEWER);
  if (!authz.ok) return authz.response;

  const { articleId } = await context.params;
  const body = await request.json();
  const { notes } = body;

  if (!notes || typeof notes !== "string") {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: {
      articleId,
      reviewerId: authz.session.user.id,
      decision: ReviewDecision.REQUEST_CHANGES,
      notes,
    },
  });

  await prisma.article.update({
    where: { id: articleId },
    data: { status: ArticleStatus.DRAFT },
  });

  return NextResponse.json({ data: review });
}
