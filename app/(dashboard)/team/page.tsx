import { Skeleton } from '@/components/ui/skeleton'

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Individual utilization by role — coming in Phase B.
        </p>
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  )
}
