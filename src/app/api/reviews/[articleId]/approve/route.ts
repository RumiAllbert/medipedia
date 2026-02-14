import { NextResponse } from "next/server";
import { z } from "zod";
import { addHours } from "date-fns";

import { ArticleStatus, ReviewDecision, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { requestIdentity, rateLimit } from "@/lib/rate-limit";
import { enqueueCouncilReview } from "@/lib/services/agents";
import { latestCouncilRunForArticle, runCouncilForArticle } from "@/lib/services/council";

type Params = {
  params: Promise<{ articleId: string }>;
};

const bodySchema = z.object({
  notes: z.string().min(8),
});

export async function POST(request: Request, { params }: Params) {
  const authz = await requireRole(Role.REVIEWER);
  if (!authz.ok) return authz.response;

  const limit = rateLimit({
    key: `review-approve:${requestIdentity(request, authz.session.user.id)}`,
    max: 20,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { articleId } = await params;
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let councilRun = await latestCouncilRunForArticle(articleId);
  if (!councilRun) {
    await runCouncilForArticle(articleId);
    councilRun = await latestCouncilRunForArticle(articleId);
  }
  if (!councilRun?.publishEligible) {
    return NextResponse.json(
      { error: "Article does not meet council publication gate." },
      { status: 409 },
    );
  }

  const [review] = await prisma.$transaction([
    prisma.review.create({
      data: {
        articleId,
        reviewerId: authz.session.user.id,
        decision: ReviewDecision.APPROVED,
        notes: parsed.data.notes,
      },
    }),
    prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        lastReviewedAt: new Date(),
        nextReviewAt: addHours(new Date(), 24),
      },
    }),
  ]);
  await enqueueCouncilReview(articleId, "article-published");

  return NextResponse.json({ data: review });
}
