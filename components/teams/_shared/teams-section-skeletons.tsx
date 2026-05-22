import { Skeleton } from '@/components/ui/skeleton'

export function TeamsToolbarSkeleton({
  showNameFilter = false,
  showCompositionFilters = false,
}: {
  showNameFilter?: boolean
  showCompositionFilters?: boolean
}) {
  const filterCount = showCompositionFilters ? 2 : showNameFilter ? 1 : 0

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5">
      <div className="flex min-w-[11.5rem] flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
      {Array.from({ length: filterCount }).map((_, index) => (
        <div key={index} className="flex min-w-[12rem] flex-1 flex-col gap-1.5 sm:max-w-md">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
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

export function TeamsCompositionGridSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-30 -mx-8 flex gap-2 border-b border-border bg-background px-8 py-2.5 shadow-sm">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-md" />
        ))}
      </div>
      <div className="flex flex-col gap-10">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl border border-border" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TeamsPageSkeleton({ variant = 'overview' }: { variant?: 'overview' | 'composition' }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1 border-b border-border pb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <TeamsToolbarSkeleton showCompositionFilters={variant === 'composition'} />
      {variant === 'composition' ? (
        <TeamsCompositionGridSkeleton />
      ) : (
        <>
          <TeamsKpiRowSkeleton />
          <TeamsDistributionSkeleton />
          <TeamsFutureCardsSkeleton />
        </>
      )}
    </div>
  )
}
