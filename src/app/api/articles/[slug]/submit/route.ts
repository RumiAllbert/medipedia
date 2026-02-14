import { NextResponse } from "next/server";

import { ArticleStatus, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { requestIdentity, rateLimit } from "@/lib/rate-limit";
import { enqueueCouncilReview } from "@/lib/services/agents";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const authz = await requireRole(Role.CONTRIBUTOR);
  if (!authz.ok) return authz.response;

  const limit = rateLimit({
    key: `article-submit:${requestIdentity(request, authz.session.user.id)}`,
    max: 25,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.article.update({
    where: { slug },
    data: { status: ArticleStatus.PENDING_REVIEW },
  });
  await enqueueCouncilReview(updated.id, "article-submitted");

  return NextResponse.json({ data: updated });
}
