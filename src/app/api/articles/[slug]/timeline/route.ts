import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { visibleArticleWhere } from "@/lib/services/articles";
import { getArticleTimeline } from "@/lib/services/article-timeline";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  if (!featureFlags.trustTimeline) {
    return NextResponse.json({ error: "Trust timeline is disabled." }, { status: 503 });
  }

  const { slug } = await params;
  const session = await auth();

  const article = await prisma.article.findFirst({
    where: visibleArticleWhere({
      slug,
      viewerId: session?.user?.id,
      viewerRole: session?.user?.role,
    }),
    select: {
      id: true,
      slug: true,
      title: true,
      trustScore: true,
      confidenceLabel: true,
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const timeline = await getArticleTimeline(article.id);
  return NextResponse.json({
    data: {
      article,
      ...timeline,
    },
  });
}
