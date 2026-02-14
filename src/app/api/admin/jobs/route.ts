import { AgentJobStatus, GenerationJobStatus, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/guard";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

type UnifiedJobRow = {
  id: string;
  jobType: "GENERATION" | "AGENT";
  status: string;
  phase: string | null;
  topicSlug: string | null;
  topicTitle: string | null;
  runAt: Date | null;
  attempt: number | null;
  maxAttempts: number | null;
  lockedAt: Date | null;
  lockedBy: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: NextRequest) {
  const authz = await requireRole(Role.ADMIN);
  if (!authz.ok) return authz.response;
  if (!featureFlags.adminJobsConsole) {
    return NextResponse.json({ error: "Admin jobs console is disabled." }, { status: 503 });
  }

  const statusParam = request.nextUrl.searchParams.get("status")?.trim().toUpperCase();
  const generationStatus = statusParam && Object.values(GenerationJobStatus).includes(statusParam as GenerationJobStatus)
    ? (statusParam as GenerationJobStatus)
    : undefined;
  const agentStatus = statusParam && Object.values(AgentJobStatus).includes(statusParam as AgentJobStatus)
    ? (statusParam as AgentJobStatus)
    : undefined;

  const [generationJobs, agentJobs] = await Promise.all([
    prisma.generationJob.findMany({
      where: generationStatus ? { status: generationStatus } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 150,
      select: {
        id: true,
        status: true,
        phase: true,
        topicSlug: true,
        topicTitle: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.agentJob.findMany({
      where: agentStatus ? { status: agentStatus } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 150,
      select: {
        id: true,
        status: true,
        attempt: true,
        maxAttempts: true,
        runAt: true,
        lockedAt: true,
        lockedBy: true,
        lastError: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const unified: UnifiedJobRow[] = [
    ...generationJobs.map((job) => ({
      id: job.id,
      jobType: "GENERATION" as const,
      status: job.status,
      phase: job.phase,
      topicSlug: job.topicSlug,
      topicTitle: job.topicTitle,
      runAt: null,
      attempt: null,
      maxAttempts: null,
      lockedAt: null,
      lockedBy: null,
      error: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })),
    ...agentJobs.map((job) => ({
      id: job.id,
      jobType: "AGENT" as const,
      status: job.status,
      phase: job.type,
      topicSlug: null,
      topicTitle: null,
      runAt: job.runAt,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
      lockedAt: job.lockedAt,
      lockedBy: job.lockedBy,
      error: job.lastError,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return NextResponse.json({ data: unified });
}
