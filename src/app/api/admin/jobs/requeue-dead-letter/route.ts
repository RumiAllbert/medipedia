import { AgentJobStatus, GenerationJobStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/guard";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const authz = await requireRole(Role.ADMIN);
  if (!authz.ok) return authz.response;
  if (!featureFlags.adminJobsConsole) {
    return NextResponse.json({ error: "Admin jobs console is disabled." }, { status: 503 });
  }

  const [agentResult, generationResult] = await prisma.$transaction([
    prisma.agentJob.updateMany({
      where: { status: AgentJobStatus.DEAD_LETTER },
      data: {
        status: AgentJobStatus.QUEUED,
        runAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        attempt: 0,
      },
    }),
    prisma.generationJob.updateMany({
      where: { status: GenerationJobStatus.FAILED },
      data: {
        status: GenerationJobStatus.QUEUED,
        phase: "QUEUED",
        progress: 0,
        startedAt: null,
        finishedAt: null,
        errorMessage: null,
      },
    }),
  ]);

  return NextResponse.json({
    data: {
      requeuedAgentDeadLetters: agentResult.count,
      requeuedGenerationFailures: generationResult.count,
    },
  });
}
