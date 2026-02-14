import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const metadata = await prisma.articleMetadata.findMany({
    where: {
      article: { status: ArticleStatus.PUBLISHED },
    },
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  for (const m of metadata) {
    const tags = m.tags as string[] | null;
    if (!tags) continue;
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const data = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ data });
}
