import { Skeleton } from "@/components/ui/skeleton";

type LoadingSkeletonProps = {
  count?: number;
};

export function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Skeleton className="h-9 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
