import { AgentJobStatus, GenerationJobStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guard";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

const bodySchema = z
  .object({
    jobType: z.enum(["GENERATION", "AGENT"]).optional(),
  })
  .optional();

export async function POST(request: Request, { params }: Params) {
  const authz = await requireRole(Role.ADMIN);
  if (!authz.ok) return authz.response;
  if (!featureFlags.adminJobsConsole) {
    return NextResponse.json({ error: "Admin jobs console is disabled." }, { status: 503 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const requestedType = parsed.data?.jobType;

  if (!requestedType || requestedType === "GENERATION") {
    const generationJob = await prisma.generationJob.findUnique({ where: { id } });
    if (generationJob) {
      const updated = await prisma.generationJob.update({
        where: { id },
        data: {
          status: GenerationJobStatus.QUEUED,
          phase: "QUEUED",
          progress: 0,
          startedAt: null,
          finishedAt: null,
          errorMessage: null,
        },
        select: {
          id: true,
          status: true,
          phase: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ data: { jobType: "GENERATION", ...updated } });
    }
  }

  if (!requestedType || requestedType === "AGENT") {
    const agentJob = await prisma.agentJob.findUnique({ where: { id } });
    if (agentJob) {
      const updated = await prisma.agentJob.update({
        where: { id },
        data: {
          status: AgentJobStatus.QUEUED,
          runAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
          attempt: 0,
        },
        select: {
          id: true,
          status: true,
          runAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ data: { jobType: "AGENT", ...updated } });
    }
  }

  return NextResponse.json({ error: "Job not found" }, { status: 404 });
}
