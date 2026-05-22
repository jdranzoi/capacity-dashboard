import { Skeleton } from '@/components/ui/skeleton'

export function TeamsToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5">
      <div className="flex min-w-[11.5rem] flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function TeamsKpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

export function TeamsDistributionSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-xl border border-border" />
      <Skeleton className="h-80 rounded-xl border border-border" />
    </div>
  )
}

export function TeamsFutureCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-36 rounded-xl border border-border" />
      <Skeleton className="h-36 rounded-xl border border-border" />
    </div>
  )
}

export function TeamsPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1 border-b border-border pb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <TeamsToolbarSkeleton />
      <TeamsKpiRowSkeleton />
      <TeamsDistributionSkeleton />
      <TeamsFutureCardsSkeleton />
    </div>
  )
}
