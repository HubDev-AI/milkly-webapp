import { Skeleton } from "@/components/ui/Skeleton";

interface FeedLoadingSkeletonProps {
  count?: number;
}

export function FeedLoadingSkeleton({ count = 8 }: FeedLoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-primary/5 rounded-3xl p-4 flex flex-col gap-4 animate-pulse">
          <Skeleton className="w-full aspect-video rounded-2xl bg-primary/5" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg bg-primary/5" />
            <Skeleton className="h-4 w-2/3 rounded-lg bg-primary/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-4 w-12 rounded-full bg-primary/5" />
              <Skeleton className="h-4 w-12 rounded-full bg-primary/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
