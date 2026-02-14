import { NextResponse } from "next/server";
import { GenerationJobStatus, Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";
import { hasRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { processGenerationJob } from "@/lib/services/article-ai";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const authz = await requireRole(Role.READER);
  if (!authz.ok) return authz.response;

  const { id } = await params;
  let job = await prisma.generationJob.findUnique({
    where: { id },
    include: { generatedArticle: { select: { slug: true } } },
  });
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    job.requestedById &&
    job.requestedById !== authz.session.user.id &&
    !hasRole(authz.session.user.role, Role.REVIEWER)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const staleBefore = new Date(Date.now() - 2 * 60_000);
  if (
    job.status === GenerationJobStatus.RUNNING &&
    !job.finishedAt &&
    job.updatedAt <= staleBefore
  ) {
    await prisma.generationJob.updateMany({
      where: {
        id: job.id,
        status: GenerationJobStatus.RUNNING,
        finishedAt: null,
        updatedAt: { lte: staleBefore },
      },
      data: {
        status: GenerationJobStatus.QUEUED,
        phase: "QUEUED",
        progress: Math.min(job.progress, 5),
        errorMessage: "Recovered stale running job.",
      },
    });
    job = await prisma.generationJob.findUnique({
      where: { id },
      include: { generatedArticle: { select: { slug: true } } },
    });
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  if (job.status === GenerationJobStatus.QUEUED) {
    await processGenerationJob(job.id);
    job = await prisma.generationJob.findUnique({
      where: { id },
      include: { generatedArticle: { select: { slug: true } } },
    });
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  return NextResponse.json({
    data: {
      id: job.id,
      status: job.status,
      phase: job.phase,
      progress: job.progress,
      topicSlug: job.topicSlug,
      topicTitle: job.topicTitle,
      errorMessage: job.errorMessage,
      articleSlug: job.generatedArticle?.slug ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  });
}
