import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-6 h-64 w-full rounded-3xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-96 rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
