import { NextRequest, NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const articles = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      slug: true,
      title: true,
      summary: true,
      trustScore: true,
      status: true,
    },
    orderBy: [{ trustScore: "desc" }, { publishedAt: "desc" }],
    take: 8,
  });

  return NextResponse.json({ data: articles });
}
