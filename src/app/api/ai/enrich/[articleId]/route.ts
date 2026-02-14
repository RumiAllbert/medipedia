import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";
import { requestIdentity, rateLimit } from "@/lib/rate-limit";
import { enrichArticleMetadata, rebuildRelatedGraph } from "@/lib/services/article-ai";
import { enqueueCouncilReview } from "@/lib/services/agents";

type Params = {
  params: Promise<{ articleId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const authz = await requireRole(Role.REVIEWER);
  if (!authz.ok) return authz.response;

  const limit = rateLimit({
    key: `enrich:${requestIdentity(request, authz.session.user.id)}`,
    max: 20,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { articleId } = await params;
  await enrichArticleMetadata(articleId);
  await rebuildRelatedGraph(articleId);
  await enqueueCouncilReview(articleId, "manual-enrich");
  return NextResponse.json({ ok: true });
}
