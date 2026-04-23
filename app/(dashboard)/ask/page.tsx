import { Skeleton } from '@/components/ui/skeleton'

export default function AskPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Ask</h1>
        <p className="text-sm text-muted-foreground">
          Query capacity data with Claude — coming in Phase D.
        </p>
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
