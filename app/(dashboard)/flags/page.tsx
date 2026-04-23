import { Skeleton } from '@/components/ui/skeleton'

export default function FlagsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Flags</h1>
        <p className="text-sm text-muted-foreground">
          Open risk flags by severity — coming in Phase C.
        </p>
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
