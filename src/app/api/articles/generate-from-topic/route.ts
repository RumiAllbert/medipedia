import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { requestIdentity, rateLimit } from "@/lib/rate-limit";
import { enqueueGenerationJob } from "@/lib/services/article-ai";
import { toSlug } from "@/lib/slug";

const bodySchema = z.object({
  topicTitle: z.string().min(3),
  topicSlug: z.string().optional(),
  sourceArticleId: z.string().optional(),
  sourceSlug: z.string().optional(),
});

export async function POST(request: Request) {
  const authz = await requireRole(Role.READER);
  if (!authz.ok) return authz.response;

  const limit = rateLimit({
    key: `generate-topic:${requestIdentity(request, authz.session.user.id)}`,
    max: 8,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const topicSlug = parsed.data.topicSlug ?? toSlug(parsed.data.topicTitle);
  const sourceArticleId = parsed.data.sourceArticleId;
  const fallbackSourceId =
    sourceArticleId || !parsed.data.sourceSlug
      ? sourceArticleId
      : (await prisma.article.findUnique({
          where: { slug: parsed.data.sourceSlug },
          select: { id: true },
        }))?.id;
  const result = await enqueueGenerationJob({
    topicTitle: parsed.data.topicTitle,
    topicSlug,
    sourceArticleId: fallbackSourceId,
    requestedById: authz.session.user.id,
  });

  return NextResponse.json(
    {
      data: {
        jobId: result.jobId,
        status: result.status,
        topicSlug: result.topicSlug,
        articleSlug: result.articleSlug,
      },
    },
    { status: 202 },
  );
}
