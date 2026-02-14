import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getVisibleArticleBySlug } from "@/lib/services/articles";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guard";

type Params = {
  params: Promise<{ slug: string }>;
};

const updateSchema = z
  .object({
    title: z.string().min(8).optional(),
    summary: z.string().min(20).optional(),
    bodyMarkdown: z.string().min(120).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field must be provided.",
  });

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const session = await auth();
  const article = await getVisibleArticleBySlug({
    slug,
    viewerId: session?.user?.id,
    viewerRole: session?.user?.role,
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: article });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authz = await requireRole(Role.CONTRIBUTOR);
  if (!authz.ok) return authz.response;

  const { slug } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      revisions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const user = authz.session.user;
  if (article.createdById !== user.id && user.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "Forbidden: You are not the author of this article" },
      { status: 403 }
    );
  }

  const latestVersion = article.revisions[0]?.version ?? 0;

  const updatedArticle = await prisma.$transaction(async (tx) => {
    const updated = await tx.article.update({
      where: { id: article.id },
      data: {
        title: parsed.data.title ?? article.title,
        summary: parsed.data.summary ?? article.summary,
        bodyMarkdown: parsed.data.bodyMarkdown ?? article.bodyMarkdown,
      },
    });

    await tx.articleRevision.create({
      data: {
        articleId: article.id,
        version: latestVersion + 1,
        contentMarkdown: parsed.data.bodyMarkdown ?? article.bodyMarkdown,
        status: article.status,
        createdBy: user.email ?? "contributor",
      },
    });

    return updated;
  });

  return NextResponse.json({ data: updatedArticle });
}
