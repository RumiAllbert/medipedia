"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type JobState = {
  jobId: string;
  status: string;
  topicSlug: string;
  articleSlug?: string | null;
  phase?: string;
  progress?: number;
  errorMessage?: string | null;
};

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function MissingArticleGate({ slug, from }: { slug: string; from?: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const topicTitle = useMemo(() => titleFromSlug(slug), [slug]);

  useEffect(() => {
    let active = true;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let pollFailures = 0;

    const canViewArticle = async (articleSlug: string) => {
      const check = await fetch(`/api/articles/${articleSlug}`, {
        method: "GET",
        cache: "no-store",
      });
      return check.ok;
    };

    const poll = async (jobId: string) => {
      try {
        const response = await fetch(`/api/generation-jobs/${jobId}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!active) return;
        if (!response.ok) {
          pollFailures += 1;
          if (response.status === 401 || response.status === 403) {
            setError("Session expired. Please sign in again.");
            return;
          }
          if (response.status === 404) {
            setError("Generation job not found. Please retry.");
            return;
          }
          if (pollFailures >= 8) {
            setError("Generation status is temporarily unavailable. Please refresh.");
            return;
          }
          pollTimer = setTimeout(() => void poll(jobId), 2000);
          return;
        }
        pollFailures = 0;
        const payload = await response.json();
        const nextState: JobState = payload.data;
        setJob((prev) => ({ ...prev, ...nextState }));
        if (nextState.status === "SUCCEEDED" && nextState.articleSlug) {
          router.replace(`/articles/${nextState.articleSlug}`);
          return;
        }
        if (nextState.status === "FAILED") {
          setError(nextState.errorMessage ?? "Generation failed.");
          return;
        }
        pollTimer = setTimeout(() => void poll(jobId), 2000);
      } catch {
        if (!active) return;
        pollFailures += 1;
        if (pollFailures >= 8) {
          setError("Generation status is temporarily unavailable. Please refresh.");
          return;
        }
        pollTimer = setTimeout(() => void poll(jobId), 2000);
      }
    };

    void (async () => {
      try {
        setIsStarting(true);
        const response = await fetch("/api/articles/generate-from-topic", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topicTitle,
            topicSlug: slug,
            sourceSlug: from,
          }),
        });

        if (response.status === 401) {
          setError("Sign in is required to generate missing topics.");
          setIsStarting(false);
          return;
        }
        if (!response.ok) {
          setError("Unable to start generation job.");
          setIsStarting(false);
          return;
        }

        const payload = await response.json();
        const data = payload.data as JobState;
        if (!active) return;
        setJob(data);

        if (data.status === "EXISTS" && data.articleSlug) {
          const visible = await canViewArticle(data.articleSlug);
          if (!active) return;
          if (!visible) {
            setError("A draft already exists for this topic but is not yet publicly visible.");
            setIsStarting(false);
            return;
          }
          router.replace(`/articles/${data.articleSlug}`);
          return;
        }

        setIsStarting(false);
        await poll(data.jobId);
      } catch {
        setError("Unable to start generation job.");
        setIsStarting(false);
      }
    })();

    return () => {
      active = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [from, router, slug, topicTitle]);

  const phaseLabels: Record<string, string> = {
    QUEUED: "Queuing generation request...",
    DEQUEUED: "Preparing to generate...",
    GENERATING_ARTICLE: "Lumi is writing the article (this may take 30-60 seconds)...",
    ENRICHING: "Enriching metadata and building topic connections...",
    COUNCIL_SCORING: "Running council quality review...",
    COMPLETE: "Complete!",
    FAILED: "Generation failed",
  };

  const currentPhase = job?.phase ?? (isStarting ? "QUEUED" : "GENERATING_ARTICLE");
  const currentProgress = job?.progress ?? (isStarting ? 5 : 35);

  return (
    <section className="mx-auto flex min-h-[65vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">On-demand generation</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{topicTitle}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        This topic does not exist yet. Lumi is generating a comprehensive, evidence-based article
        and running quality scoring before publishing.
      </p>

      <div className="mt-8 w-full rounded-2xl border bg-card p-5 text-left shadow-sm">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{phaseLabels[currentPhase] ?? currentPhase}</span>
          <span>{currentProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
        {currentPhase === "GENERATING_ARTICLE" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Lumi is classifying the topic type, selecting appropriate sections, and writing
            detailed content with citations from authoritative medical sources.
          </p>
        )}
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}{" "}
          <Link href="/signin" className="font-semibold underline">
            Sign in
          </Link>
        </div>
      ) : null}
    </section>
  );
}
