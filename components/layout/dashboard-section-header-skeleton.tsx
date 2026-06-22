import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSectionHeaderSkeleton({
  filterCount = 1,
}: {
  filterCount?: number
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {Array.from({ length: filterCount }).map((_, index) => (
          <div key={index} className="flex min-w-[9.5rem] flex-col gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-[9.5rem] rounded-lg" />
          </div>
        ))}
      </div>
    </header>
  );
}
