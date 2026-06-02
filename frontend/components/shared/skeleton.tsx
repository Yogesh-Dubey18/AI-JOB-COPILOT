"use client";

import { Card, CardContent } from "@/components/ui/card";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-muted/60 ${className}`} />
  );
}

export function CardSkeleton({ count = 3, gridClass = "grid gap-4 md:grid-cols-3" }: { count?: number; gridClass?: string }) {
  return (
    <div className={gridClass} aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="border bg-card/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="flex gap-2 pt-2 justify-end">
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="border bg-card/40">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24 shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="border bg-card/80">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
