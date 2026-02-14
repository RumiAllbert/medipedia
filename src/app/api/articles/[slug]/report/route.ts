import { ContentReportType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { visibleArticleWhere } from "@/lib/services/articles";

const bodySchema = z.object({
  type: z.nativeEnum(ContentReportType),
  details: z.string().min(16).max(2500),
});

type Params = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: Params) {
  if (!featureFlags.articleReporting) {
    return NextResponse.json({ error: "Article reporting is currently disabled." }, { status: 503 });
  }

  const { slug } = await params;
  const session = await auth();
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const article = await prisma.article.findFirst({
    where: visibleArticleWhere({
      slug,
      viewerId: session?.user?.id,
      viewerRole: session?.user?.role,
    }),
    select: { id: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const report = await prisma.contentReport.create({
    data: {
      articleId: article.id,
      reporterId: session?.user?.id ?? null,
      type: parsed.data.type,
      details: parsed.data.details.trim(),
    },
    select: {
      id: true,
      articleId: true,
      reporterId: true,
      type: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: report }, { status: 201 });
}
