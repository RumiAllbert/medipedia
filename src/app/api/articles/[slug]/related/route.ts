import { NextResponse } from "next/server";
import { ArticleStatus, Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const session = await auth();
  const includeDrafts = hasRole(session?.user?.role, Role.CONTRIBUTOR);
  const viewerId = session?.user?.id;
  const article = await prisma.article.findFirst({
    where: {
      slug,
      ...(includeDrafts
        ? {}
        : {
            OR: [
              { status: ArticleStatus.PUBLISHED },
              ...(viewerId
                ? [
                    {
                      status: ArticleStatus.AI_DRAFT,
                      createdById: viewerId,
                    },
                  ]
                : []),
            ],
          }),
    },
    include: {
      outgoingRelated: {
        orderBy: { score: "desc" },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: article.outgoingRelated });
}
