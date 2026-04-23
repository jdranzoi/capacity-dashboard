import { Skeleton } from '@/components/ui/skeleton'

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Project actuals and capacity impact — coming in Phase C.
        </p>
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
