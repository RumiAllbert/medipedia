import { addMinutes } from "date-fns";
import {
  AgentJobStatus,
  AgentJobType,
  ArticleStatus,
  GenerationJobStatus,
  type Prisma,
} from "@prisma/client";

import {
  enrichArticleMetadata,
  processGenerationJob,
  rebuildRelatedGraph,
} from "@/lib/services/article-ai";
import { runCouncilForArticle } from "@/lib/services/council";
import { prisma } from "@/lib/prisma";

export async function enqueueAgentJob(input: {
  type: AgentJobType;
  payload: Prisma.InputJsonValue;
  runAt?: Date;
}) {
  return prisma.agentJob.create({
    data: {
      type: input.type,
      payloadJson: input.payload,
      status: AgentJobStatus.QUEUED,
      runAt: input.runAt ?? new Date(),
    },
  });
}

export async function enqueueCouncilReview(articleId: string, reason: string) {
  const existing = await prisma.agentJob.findFirst({
    where: {
      type: AgentJobType.COUNCIL_REVIEW,
      status: { in: [AgentJobStatus.QUEUED, AgentJobStatus.RUNNING] },
      payloadJson: {
        path: ["articleId"],
        equals: articleId,
      },
    },
  });
  if (existing) return existing;

  return enqueueAgentJob({
    type: AgentJobType.COUNCIL_REVIEW,
    payload: { articleId, reason },
  });
}

async function claimQueuedGenerationJobs(limit: number): Promise<string[]> {
  const workerId = `worker:${process.pid}`;
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "GenerationJob"
      WHERE status = 'QUEUED'
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    await tx.generationJob.updateMany({
      where: { id: { in: ids } },
      data: {
        status: GenerationJobStatus.RUNNING,
        phase: "DEQUEUED",
        progress: 5,
        startedAt: new Date(),
      },
    });
    await tx.agentJob.create({
      data: {
        type: AgentJobType.GENERATE_TOPIC,
        payloadJson: { ids, workerId },
        status: AgentJobStatus.SUCCEEDED,
      },
    });
    return ids;
  });
}

async function claimAgentJobs(limit: number): Promise<string[]> {
  const workerId = `worker:${process.pid}`;
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "AgentJob"
      WHERE status = 'QUEUED'
      AND "runAt" <= NOW()
      ORDER BY "runAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    await tx.agentJob.updateMany({
      where: { id: { in: ids } },
      data: {
        status: AgentJobStatus.RUNNING,
        lockedAt: new Date(),
        lockedBy: workerId,
      },
    });
    return ids;
  });
}

async function processAgentJob(jobId: string) {
  const job = await prisma.agentJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== AgentJobStatus.RUNNING) return;
  const payload = (job.payloadJson as Record<string, unknown>) ?? {};

  try {
    if (job.type === AgentJobType.COUNCIL_REVIEW && typeof payload.articleId === "string") {
      await runCouncilForArticle(payload.articleId);
    }
    if (job.type === AgentJobType.ENRICH_METADATA && typeof payload.articleId === "string") {
      await enrichArticleMetadata(payload.articleId);
    }
    if (job.type === AgentJobType.REBUILD_RELATED && typeof payload.articleId === "string") {
      await rebuildRelatedGraph(payload.articleId);
    }
    await prisma.agentJob.update({
      where: { id: job.id },
      data: {
        status: AgentJobStatus.SUCCEEDED,
        lockedAt: null,
        lockedBy: null,
      },
    });
  } catch (error) {
    const attempt = job.attempt + 1;
    const maxAttempts = job.maxAttempts;
    const shouldDeadLetter = attempt >= maxAttempts;
    await prisma.agentJob.update({
      where: { id: job.id },
      data: {
        status: shouldDeadLetter ? AgentJobStatus.DEAD_LETTER : AgentJobStatus.QUEUED,
        attempt,
        lastError: error instanceof Error ? error.message : "Unknown worker error",
        runAt: shouldDeadLetter ? job.runAt : addMinutes(new Date(), Math.min(30, 2 ** attempt)),
        lockedAt: null,
        lockedBy: null,
      },
    });
  }
}

export async function enqueuePeriodicCouncilSweep(limit = 50) {
  const articles = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      nextReviewAt: { lte: new Date() },
    },
    select: { id: true },
    take: limit,
  });
  for (const article of articles) {
    await enqueueCouncilReview(article.id, "periodic-sweep");
  }
  return articles.length;
}

export async function runAgentTick(options?: {
  maxGenerationJobs?: number;
  maxAgentJobs?: number;
}) {
  const generationIds = await claimQueuedGenerationJobs(options?.maxGenerationJobs ?? 3);
  for (const id of generationIds) {
    await processGenerationJob(id);
  }

  await enqueuePeriodicCouncilSweep(25);

  const agentIds = await claimAgentJobs(options?.maxAgentJobs ?? 10);
  for (const id of agentIds) {
    await processAgentJob(id);
  }

  return {
    processedGenerationJobs: generationIds.length,
    processedAgentJobs: agentIds.length,
  };
}
