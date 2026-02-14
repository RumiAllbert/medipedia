"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminJobRow = {
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

function statusVariant(status: string): "success" | "warning" | "destructive" | "neutral" {
  if (status === "SUCCEEDED" || status === "RESOLVED") return "success";
  if (status === "RUNNING" || status === "TRIAGED") return "warning";
  if (status === "FAILED" || status === "DEAD_LETTER") return "destructive";
  return "neutral";
}

export function JobsConsole({ jobs }: { jobs: AdminJobRow[] }) {
  const router = useRouter();
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [isRequeueingDeadLetter, setIsRequeueingDeadLetter] = useState(false);

  const retryJob = async (job: AdminJobRow) => {
    setBusyJobId(job.id);
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/retry`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobType: job.jobType }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(err?.error ?? "Retry failed");
        return;
      }
      toast.success(`${job.jobType.toLowerCase()} job queued for retry`);
      router.refresh();
    } catch {
      toast.error("Retry failed");
    } finally {
      setBusyJobId(null);
    }
  };

  const requeueDeadLetters = async () => {
    setIsRequeueingDeadLetter(true);
    try {
      const response = await fetch("/api/admin/jobs/requeue-dead-letter", { method: "POST" });
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(err?.error ?? "Dead-letter requeue failed");
        return;
      }
      toast.success("Dead-letter jobs requeued");
      router.refresh();
    } catch {
      toast.error("Dead-letter requeue failed");
    } finally {
      setIsRequeueingDeadLetter(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <p className="text-sm font-medium">Operations</p>
          <p className="text-xs text-muted-foreground">
            Retry individual jobs or requeue dead letters in one action.
          </p>
        </div>
        <Button variant="outline" onClick={requeueDeadLetters} disabled={isRequeueingDeadLetter}>
          <ShieldAlert className="mr-2 h-4 w-4" />
          Requeue dead letters
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Lock / Attempts</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={`${job.jobType}-${job.id}`}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{job.jobType}</p>
                    <p className="text-xs text-muted-foreground">{job.id.slice(0, 10)}...</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                  {job.phase && (
                    <p className="mt-1 text-xs text-muted-foreground">{job.phase}</p>
                  )}
                </TableCell>
                <TableCell>
                  {job.topicTitle ? (
                    <div>
                      <p className="font-medium">{job.topicTitle}</p>
                      <p className="text-xs text-muted-foreground">{job.topicSlug}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">System job</p>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">
                    {job.lockedBy ? `Locked by ${job.lockedBy}` : "Unlocked"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attempts: {job.attempt ?? 0}/{job.maxAttempts ?? "-"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="max-w-[280px] truncate text-sm text-muted-foreground">
                    {job.error ?? "-"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job.updatedAt).toLocaleString()}
                  </p>
                  {job.runAt && (
                    <p className="text-xs text-muted-foreground">runAt: {new Date(job.runAt).toLocaleString()}</p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryJob(job)}
                    disabled={busyJobId === job.id}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No jobs found for the current filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
