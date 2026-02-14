import { Skeleton } from "@/components/ui/skeleton";

export default function OrbisLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Skeleton className="h-4 w-32" />

      <Skeleton className="mt-6 h-10 w-40" />
      <Skeleton className="mt-2 h-5 w-96" />

      <div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* Controls skeleton */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Canvas skeleton */}
        <Skeleton className="h-[min(600px,70vh)] w-full rounded-none" />

        {/* Legend skeleton */}
        <div className="flex items-center gap-4 border-t px-4 py-2.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
