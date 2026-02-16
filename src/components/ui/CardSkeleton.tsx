import { cn } from "@/lib/Utils";

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 2, className }: CardSkeletonProps) {
  return (
    <div className={cn("cream-card p-4 animate-pulse", className)}>
      <div className="h-5 w-32 bg-secondary rounded" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="h-4 w-48 bg-secondary/50 rounded mt-2" />
      ))}
    </div>
  );
}
