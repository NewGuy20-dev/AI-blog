"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--color-border)]/50",
        className
      )}
    />
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="h-full bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col">
      <Skeleton className="w-full h-40 rounded-none" />
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}
