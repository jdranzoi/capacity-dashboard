import { Skeleton } from '@/components/ui/skeleton'

export function TeamPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1 border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5">
        <div className="flex min-w-[11.5rem] flex-col gap-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex min-w-[7.5rem] flex-col gap-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-8 w-24" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl border border-border" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-96 rounded-xl border border-border" />
      </div>
    </div>
  )
}
