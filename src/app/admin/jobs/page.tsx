import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { JobsConsole, type AdminJobRow } from "./jobs-console";

async function getJobs(): Promise<AdminJobRow[]> {
  const [generationJobs, agentJobs] = await Promise.all([
    prisma.generationJob.findMany({
      orderBy: { updatedAt: "desc" },
      take: 120,
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
      orderBy: { updatedAt: "desc" },
      take: 120,
      select: {
        id: true,
        status: true,
        type: true,
        runAt: true,
        attempt: true,
        maxAttempts: true,
        lockedAt: true,
        lockedBy: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const unified: AdminJobRow[] = [
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
  ];

  return unified.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export default async function AdminJobsPage() {
  if (!featureFlags.adminJobsConsole) {
    return (
      <div className="mt-6 rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs Console</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Jobs console is disabled. Enable <code>FF_ADMIN_JOBS_CONSOLE</code> to access job operations.
        </p>
      </div>
    );
  }

  const jobs = await getJobs();

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">Jobs Console</h1>
      <p className="mt-1 text-muted-foreground">
        Operational view across generation and agent jobs with retry controls.
      </p>

      <JobsConsole jobs={jobs} />
    </div>
  );
}
