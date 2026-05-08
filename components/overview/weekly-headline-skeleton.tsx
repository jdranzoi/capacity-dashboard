import { Skeleton } from '@/components/ui/skeleton'

export function WeeklyHeadlineSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3 border-b border-border/80 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex min-w-[11.5rem] flex-col gap-1">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-16 min-w-[200px] flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-72 rounded-xl lg:col-span-4" />
        <Skeleton className="h-72 rounded-xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-xl lg:col-span-7" />
        <Skeleton className="h-80 rounded-xl lg:col-span-5" />
      </div>
    </div>
  )
}
