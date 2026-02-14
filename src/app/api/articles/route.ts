import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";

import { createEditorialArticle, listPublishedArticles } from "@/lib/services/articles";
import { enrichArticleMetadata, rebuildRelatedGraph } from "@/lib/services/article-ai";
import { requireRole } from "@/lib/auth/guard";
import { requestIdentity, rateLimit } from "@/lib/rate-limit";
import { enqueueCouncilReview } from "@/lib/services/agents";

const createSchema = z.object({
  title: z.string().min(8),
  summary: z.string().min(20),
  bodyMarkdown: z.string().min(120),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const data = await listPublishedArticles(query);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const authz = await requireRole(Role.CONTRIBUTOR);
  if (!authz.ok) return authz.response;

  const limit = rateLimit({
    key: `article-create:${requestIdentity(request, authz.session.user.id)}`,
    max: 15,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const article = await createEditorialArticle({
    ...parsed.data,
    createdBy: authz.session.user.email ?? "contributor@medipedia.local",
    createdById: authz.session.user.id,
  });
  await enrichArticleMetadata(article.id);
  await rebuildRelatedGraph(article.id);
  await enqueueCouncilReview(article.id, "article-created");

  return NextResponse.json({ data: article }, { status: 201 });
}
